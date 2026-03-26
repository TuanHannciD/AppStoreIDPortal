import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { syncAppAccountById } from "@/lib/app-account-sync";
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
 * Má»¥c Ä‘Ã­ch:
 * - DÃ¹ng verificationToken tá»« bÆ°á»›c verify
 * - Láº¥y full account info
 * - Trá»« quota táº¡i Ä‘Ã¢y
 * - Tráº£ dá»¯ liá»‡u Ä‘áº§y Ä‘á»§ cho client
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

    // Token pháº£i Ä‘Ãºng vá»›i code trÃªn URL
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

    // Token Ä‘Ã£ dÃ¹ng rá»“i
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

    // Token háº¿t háº¡n
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

    // Láº¥y account Ä‘áº§u tiÃªn Ä‘ang active theo sortOrder
    const activeLinkAccounts = sharePage.sharePageAccounts.filter(
      (x) => x.isActive && x.appAccount?.isActive,
    );

    let selectedAccount = null;
    let hadSyncCandidate = false;
    let hadSyncFailure = false;
    let lastSyncFailureMessage = "";

    for (const linkAccount of activeLinkAccounts) {
      const candidate = linkAccount.appAccount;
      if (!candidate) continue;

      const usesSyncApi = Boolean(candidate.apiSourceConfigId);
      if (!usesSyncApi) {
        selectedAccount = candidate;
        break;
      }

      hadSyncCandidate = true;
      const syncResult = await syncAppAccountById({
        appId: candidate.appId,
        accountId: candidate.id,
      });

      if (syncResult?.ok && syncResult?.item) {
        selectedAccount = syncResult.item;
        break;
      }

      hadSyncFailure = true;
      lastSyncFailureMessage = syncResult?.message || syncResult?.detail || "Sync failed";
    }

    if (!selectedAccount) {
      const failureMessage = hadSyncCandidate && hadSyncFailure
        ? lastSyncFailureMessage || "All synced accounts failed during reveal"
        : "No active account is assigned to this share page";

      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
        action: "REVEAL_FAILED",
        success: false,
        message: failureMessage,
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: hadSyncCandidate && hadSyncFailure ? "SYNC_ACCOUNT_UNAVAILABLE" : "NO_ACCOUNT_AVAILABLE",
          message: hadSyncCandidate && hadSyncFailure
            ? (lastSyncFailureMessage || "All synced accounts failed during reveal")
            : "No account is currently available for this share link",
        },
        { status: hadSyncCandidate && hadSyncFailure ? 502 : 404 },
      );
    }

    const appAccount = selectedAccount;

    /**
     * Transaction race-safe cho bước reveal:
     * 1. claim token nếu token vẫn chưa bị consume
     * 2. consume quota bằng update có điều kiện
     * 3. nếu quota không còn, rollback và trả lỗi
     * 4. ghi log REVEAL nếu thành công
     */
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const tokenClaim = await tx.sharePassVerification.updateMany({
        where: {
          id: verification.id,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

      if (tokenClaim.count !== 1) {
        throw new Error("TOKEN_ALREADY_CONSUMED");
      }

      const quotaConsume = await tx.sharePass.updateMany({
        where: {
          id: sharePass.id,
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
          quotaUsed: {
            lt: sharePass.quotaTotal,
          },
        },
        data: {
          quotaUsed: {
            increment: 1,
          },
          lastRevealedAt: now,
        },
      });

      if (quotaConsume.count !== 1) {
        throw new Error("QUOTA_EXHAUSTED_RACE");
      }

      const updatedPass = await tx.sharePass.findUnique({
        where: { id: sharePass.id },
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

    if (!result) {
      return Response.json(
        {
          success: false,
          status: "SERVER_ERROR",
          message: "Failed to update pass after reveal",
        },
        { status: 500 },
      );
    }

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
    if (String(err?.message || err) === "TOKEN_ALREADY_CONSUMED") {
      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    if (String(err?.message || err) === "QUOTA_EXHAUSTED_RACE") {
      return Response.json(
        {
          success: false,
          status: "QUOTA_EXHAUSTED",
          message: "Quota has been exhausted for this pass",
        },
        { status: 403 },
      );
    }

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
