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

const RevealSchema = z.object({
  verificationToken: z.string().min(1),
});

/**
 * POST /api/share-pages/by-code/[code]/reveal
 *
 * Mục đích:
 * - Dùng verificationToken từ bước verify
 * - Lấy full account info
 * - Trừ quota tại đây
 * - Trả dữ liệu đầy đủ cho client
 */
export async function POST(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const body = await req.json();
    const parsed = RevealSchema.safeParse(body);

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
            sharePageAccounts: {
              where: {
                isActive: true,
              },
              orderBy: {
                sortOrder: "asc",
              },
              include: {
                appAccount: true,
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

    // Token phải đúng với code trên URL
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

    // Token đã dùng rồi
    if (verification.consumedAt) {
      await createShareAuthLog(prisma, {
        sharePageId: verification.sharePageId,
        sharePageCode: verification.sharePage.code,
        sharePassId: verification.sharePassId,
        sharePassLabel: verification.sharePass.label,
        appId: verification.sharePage.app.id,
        appName: verification.sharePage.app.name,
        action: "REVEAL_FAILED",
        success: false,
        message: "Verification token already consumed",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    // Token hết hạn
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
        message: "Verification token expired",
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
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "LINK_EXPIRED",
        success: false,
        message: "Reveal blocked because share link expired",
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
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "PASS_REVOKED",
        success: false,
        message: sharePass.reason || "Pass revoked",
        ...meta,
      });

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
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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

    const remainingQuota = getRemainingQuota(sharePass);

    if (remainingQuota <= 0) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "QUOTA_BLOCK",
        success: false,
        message: "Quota exhausted at reveal step",
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

    // Lấy account đầu tiên đang active theo sortOrder
    const activeLinkAccount = sharePage.sharePageAccounts.find(
      (x) => x.isActive && x.appAccount?.isActive,
    );

    if (!activeLinkAccount?.appAccount) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "REVEAL_FAILED",
        success: false,
        message: "No active account is assigned to this share page",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "NO_ACCOUNT_AVAILABLE",
          message: "No account is currently available for this share link",
        },
        { status: 404 },
      );
    }

    const appAccount = activeLinkAccount.appAccount;

    /**
     * Transaction ở bước reveal:
     * 1. tăng quotaUsed
     * 2. update lastRevealedAt
     * 3. mark verification token consumed
     * 4. ghi log REVEAL
     *
     * Đây là chỗ consume quota thật theo flow mới.
     */
    const result = await prisma.$transaction(async (tx) => {
      const updatedPass = await tx.sharePass.update({
        where: { id: sharePass.id },
        data: {
          quotaUsed: {
            increment: 1,
          },
          lastRevealedAt: new Date(),
        },
      });

      await tx.sharePassVerification.update({
        where: { id: verification.id },
        data: {
          consumedAt: new Date(),
        },
      });

      await createShareAuthLog(tx, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "REVEAL",
        success: true,
        message: "Account info revealed successfully",
        ...meta,
      });

      return updatedPass;
    });

    return Response.json({
      success: true,
      status: "ACCESS_GRANTED",
      remainingQuota: getRemainingQuota(result),
      item: {
        code: sharePage.code,
        note: sharePage.note,
        app: {
          id: sharePage.app.id,
          name: sharePage.app.name,
          slug: sharePage.app.slug,
          packageType: sharePage.app.packageType,
          description: sharePage.app.description,
        },
      },
      account: {
        id: appAccount.id,
        title: appAccount.title,
        email: appAccount.email,
        username: appAccount.username,
        password: appAccount.password,
        twoFaKey: appAccount.twoFaKey,
        backupCode: appAccount.backupCode,
        note: appAccount.note,
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message: "Failed to reveal account info",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
