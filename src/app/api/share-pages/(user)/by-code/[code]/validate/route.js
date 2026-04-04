import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyShareAccessToken } from "@/lib/share-access-token";
import {
  createShareAuthLog,
  getRemainingQuota,
  getRequestMeta,
  isShareLinkExpired,
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

    const tokenPayload = verifyShareAccessToken(parsed.data.verificationToken);

    if (!tokenPayload || tokenPayload.code !== code) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
        { status: 401 },
      );
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { id: tokenPayload.shareLinkId },
    });
    const sharePass = await prisma.sharePass.findUnique({
      where: { id: tokenPayload.sharePassId },
    });

    if (!shareLink || !sharePass || sharePass.shareLinkId !== shareLink.id) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
        { status: 401 },
      );
    }

    const tokenIssuedAt = new Date(tokenPayload.issuedAt * 1000);

    if (
      sharePass.lastRevealedAt
      && new Date(sharePass.lastRevealedAt).getTime() >= tokenIssuedAt.getTime()
    ) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    if (isShareLinkExpired(shareLink)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "LINK_EXPIRED",
        success: false,
        message: "Verification token blocked because share link expired",
        ...meta,
      });

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
      verificationToken: parsed.data.verificationToken,
      expiresAt: new Date(tokenPayload.expiresAt * 1000).toISOString(),
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
