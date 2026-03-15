import crypto from "crypto";

/**
 * Tính quota còn lại của một pass.
 *
 * Schema hiện tại của bạn dùng:
 * - quotaTotal
 * - quotaUsed
 *
 * remaining = total - used
 */
export function getRemainingQuota(sharePass) {
  const total = Number(sharePass?.quotaTotal || 0);
  const used = Number(sharePass?.quotaUsed || 0);
  return Math.max(total - used, 0);
}

/**
 * Kiểm tra SharePage đã hết hạn chưa.
 */
export function isSharePageExpired(sharePage) {
  if (!sharePage?.expiresAt) return false;
  return new Date(sharePage.expiresAt).getTime() < Date.now();
}

/**
 * Kiểm tra SharePass đã hết hạn riêng chưa.
 */
export function isSharePassExpired(sharePass) {
  if (!sharePass?.expiresAt) return false;
  return new Date(sharePass.expiresAt).getTime() < Date.now();
}

/**
 * Kiểm tra pass có bị revoke chưa.
 */
export function isSharePassRevoked(sharePass) {
  return Boolean(sharePass?.revokedAt);
}

/**
 * Sinh token tạm thời cho bước verify -> reveal.
 *
 * Dùng random bytes để tạo token đủ khó đoán.
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Lấy client metadata cơ bản từ request để log.
 * Tạm thời lấy:
 * - ipAddress
 * - userAgent
 *
 * Có thể mở rộng sau nếu bạn dùng proxy / CDN / Cloudflare.
 */
export function getRequestMeta(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const userAgent = req.headers.get("user-agent") || null;

  const ipAddress = forwardedFor?.split(",")?.[0]?.trim() || realIp || null;

  return {
    ipAddress,
    userAgent,
  };
}

/**
 * Ghi log auth/reveal để audit.
 *
 * action ví dụ:
 * - LINK_READY
 * - VERIFY_PASS
 * - INVALID_PASS
 * - PASS_REVOKED
 * - QUOTA_BLOCK
 * - REVEAL
 * - REVEAL_FAILED
 */
export async function createShareAuthLog(prisma, data) {
  return prisma.shareAuthLog.create({
    data: {
      sharePageId: data.sharePageId,
      sharePassId: data.sharePassId ?? null,
      action: data.action,
      success: Boolean(data.success),
      message: data.message ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    },
  });
}
