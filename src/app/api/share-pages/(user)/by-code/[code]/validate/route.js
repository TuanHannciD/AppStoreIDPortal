import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createShareAuthLog,
  getRemainingQuota,
  getRequestMeta,
  isSharePageExpired,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";

const ValidateSchema = z.object({
  verificationToken: z.string().min(1),
});

export async function POST(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const body = await req.json();
    const parsed = ValidateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          status: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { verificationToken } = parsed.data;

    const verification = await prisma.sharePassVerification.findUnique({
      where: { token: verificationToken },
      include: {
        sharePage: {
          include: {
            app: {
              select: {
                id: true,
                name: true,
                slug: true,
                packageType: true,
                description: true,
              },
            },
          },
        },
        sharePass: true,
      },
    });

    if (!verification) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
        { status: 401 },
      );
    }

    if (verification.sharePage.code !== code) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token does not match this share link",
        },
        { status: 401 },
      );
    }

    if (verification.consumedAt) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      await createShareAuthLog(prisma, {
        sharePageId: verification.sharePageId,
        sharePageCode: verification.sharePage.code,
        sharePassId: verification.sharePassId,
        sharePassLabel: verification.sharePass.label,
        appId: verification.sharePage.app.id,
        appName: verification.sharePage.app.name,
        action: "TOKEN_EXPIRED",
        success: false,
        message: "Verification token expired at validate step",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "TOKEN_EXPIRED",
          message: "Verification token has expired",
        },
        { status: 410 },
      );
    }

    const sharePage = verification.sharePage;
    const sharePass = verification.sharePass;

    if (isSharePageExpired(sharePage)) {
      return Response.json(
        {
          success: false,
          status: "LINK_EXPIRED",
          message: "This share link has expired",
        },
        { status: 410 },
      );
    }

    if (isSharePassRevoked(sharePass)) {
      return Response.json(
        {
          success: false,
          status: "PASS_REVOKED",
          message: sharePass.reason || "This pass has been revoked",
        },
        { status: 403 },
      );
    }

    if (isSharePassExpired(sharePass)) {
      return Response.json(
        {
          success: false,
          status: "PASS_EXPIRED",
          message: "This pass has expired",
        },
        { status: 410 },
      );
    }

    const remainingQuota = getRemainingQuota(sharePass);
    if (remainingQuota <= 0) {
      return Response.json(
        {
          success: false,
          status: "QUOTA_EXHAUSTED",
          message: "Quota has been exhausted for this pass",
        },
        { status: 403 },
      );
    }

    return Response.json({
      success: true,
      status: "TOKEN_VALID",
      verificationToken,
      expiresAt: verification.expiresAt,
      passInfo: {
        id: sharePass.id,
        label: sharePass.label,
        quotaTotal: sharePass.quotaTotal,
        quotaUsed: sharePass.quotaUsed,
        remainingQuota,
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message: "Failed to validate verification token",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}