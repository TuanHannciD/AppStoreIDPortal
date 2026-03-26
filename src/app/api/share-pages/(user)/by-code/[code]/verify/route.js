import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createShareAuthLog,
  generateVerificationToken,
  getRemainingQuota,
  getRequestMeta,
  isSharePageExpired,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";

const VerifyPassSchema = z.object({
  pass: z.string().min(1).max(128),
});

/**
 * POST /api/share-pages/by-code/[code]/verify
 *
 * Mục đích:
 * - Xác thực pass
 * - Chưa trả account info
 * - Chưa trừ quota theo flow mới
 * - Tạo verification token ngắn hạn cho bước reveal
 */
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

    const sharePage = await prisma.sharePage.findUnique({
      where: { code },
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
        passes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!sharePage) {
      return Response.json(
        {
          success: false,
          status: "NOT_FOUND",
          message: "Share link not found",
        },
        { status: 404 },
      );
    }

    if (isSharePageExpired(sharePage)) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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

    // Tìm pass khớp bằng cách compare hash từng pass
    // Vì đang lưu passwordHash nên không thể query trực tiếp theo pass plaintext.
    let matchedPass = null;

    for (const item of sharePage.passes) {
      const ok = await bcrypt.compare(rawPass, item.passwordHash);
      if (ok) {
        matchedPass = item;
        break;
      }
    }

    // Không tìm được pass đúng
    if (!matchedPass) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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

    // Pass bị revoke
    if (isSharePassRevoked(matchedPass)) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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

    // Pass hết hạn riêng
    if (isSharePassExpired(matchedPass)) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
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

    const remainingQuota = getRemainingQuota(matchedPass);

    if (remainingQuota <= 0) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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

    /**
     * Flow mới:
     * - verify chỉ tạo token
     * - chưa consume quota
     *
     * Nếu sau này bạn muốn support flow cũ bằng consumeOnVerify = true
     * thì có thể xử lý riêng ở đây.
     *
     * Hiện tại vẫn tạo token để bước reveal dùng chung.
     */
    const token = generateVerificationToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 1000); // 30s

    await prisma.$transaction(async (tx) => {
      // update thời điểm verify gần nhất
      await tx.sharePass.update({
        where: { id: matchedPass.id },
        data: {
          lastVerifiedAt: new Date(),
        },
      });

      // tạo verification token
      await tx.sharePassVerification.create({
        data: {
          token,
          sharePageId: sharePage.id,
          sharePassId: matchedPass.id,
          expiresAt: tokenExpiresAt,
        },
      });

      await createShareAuthLog(tx, {
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        sharePassId: matchedPass.id,
        sharePassLabel: matchedPass.label,
        appId: sharePage.app.id,
        appName: sharePage.app.name,
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
      passInfo: {
        id: matchedPass.id,
        label: matchedPass.label,
        quotaTotal: matchedPass.quotaTotal,
        quotaUsed: matchedPass.quotaUsed,
        remainingQuota,
      },
      item: {
        code: sharePage.code,
        note: sharePage.note,
        expiresAt: sharePage.expiresAt,
        consumeOnVerify: sharePage.consumeOnVerify,
        app: {
          id: sharePage.app.id,
          name: sharePage.app.name,
          slug: sharePage.app.slug,
          packageType: sharePage.app.packageType,
          description: sharePage.app.description,
        },
      },
    });
  } catch (err) {
    console.error("[verify] fatal error:", err);
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
