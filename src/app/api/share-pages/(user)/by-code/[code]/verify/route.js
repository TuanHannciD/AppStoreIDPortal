import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createShareAccessToken } from "@/lib/share-access-token";
import {
  createShareAuthLog,
  getRemainingQuota,
  getRequestMeta,
  isShareLinkExpired,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";

const VerifyPassSchema = z.object({
  pass: z.string().min(1).max(128),
});

export async function POST(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const body = await req.json();
    const parsed = VerifyPassSchema.safeParse(body);

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

    const rawPass = parsed.data.pass;

    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
      include: {
        passes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shareLink) {
      return Response.json(
        {
          success: false,
          status: "NOT_FOUND",
          message: "Share link not found",
        },
        { status: 404 },
      );
    }

    if (isShareLinkExpired(shareLink)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        action: "LINK_EXPIRED",
        success: false,
        message: "Verify blocked because share link expired",
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

    let matchedPass = null;

    for (const item of shareLink.passes) {
      const ok = await bcrypt.compare(rawPass, item.passwordHash);
      if (ok) {
        matchedPass = item;
        break;
      }
    }

    if (!matchedPass) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        action: "INVALID_PASS",
        success: false,
        message: "Invalid pass",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "INVALID_PASS",
          message: "Invalid pass",
        },
        { status: 401 },
      );
    }

    if (isSharePassRevoked(matchedPass)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        action: "PASS_REVOKED",
        success: false,
        message: matchedPass.reason || "Pass revoked",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "PASS_REVOKED",
          message: matchedPass.reason || "This pass has been revoked",
        },
        { status: 403 },
      );
    }

    if (isSharePassExpired(matchedPass)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        action: "PASS_EXPIRED",
        success: false,
        message: "Pass expired",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "PASS_EXPIRED",
          message: "This pass has expired",
        },
        { status: 410 },
      );
    }

    const remainingQuota = getRemainingQuota(matchedPass);

    if (remainingQuota <= 0) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        action: "QUOTA_BLOCK",
        success: false,
        message: "Quota exhausted",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "QUOTA_EXHAUSTED",
          message: "Quota has been exhausted for this pass",
        },
        { status: 403 },
      );
    }

    const { token, expiresAt } = createShareAccessToken({
      shareLinkId: shareLink.id,
      sharePassId: matchedPass.id,
      code: shareLink.code,
    });

    await prisma.$transaction(async (tx) => {
      await tx.sharePass.update({
        where: { id: matchedPass.id },
        data: {
          lastVerifiedAt: new Date(),
        },
      });

      await createShareAuthLog(tx, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        action: "VERIFY_PASS",
        success: true,
        message: "Pass verified successfully",
        ...meta,
      });
    });

    return Response.json({
      success: true,
      status: "VERIFIED",
      verificationToken: token,
      expiresAt,
      passInfo: {
        id: matchedPass.id,
        label: matchedPass.label,
        quotaTotal: matchedPass.quotaTotal,
        quotaUsed: matchedPass.quotaUsed,
        remainingQuota,
      },
      item: {
        code: shareLink.code,
        note: shareLink.note,
        expiresAt: shareLink.expiresAt,
        consumeOnVerify: shareLink.consumeOnVerify,
        app: {
          id: shareLink.id,
          name: shareLink.appLabel,
          slug: "-",
          packageType: "-",
          description: shareLink.appDescription,
        },
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message: "Failed to verify pass",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
