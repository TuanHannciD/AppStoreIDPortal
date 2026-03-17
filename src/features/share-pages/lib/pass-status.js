import { isSharePassExpired, isSharePassRevoked } from "@/lib/share-public";

/**
 * File helper này chỉ chuyên về một việc:
 * xác định trạng thái business của pass.
 *
 * Tách riêng file này giúp:
 * - UI admin dùng lại được
 * - API dùng lại được
 * - tránh mỗi nơi tự viết logic status một kiểu
 *
 * Đây là "business rule helper", không phải component UI.
 */

/**
 * Chuẩn hóa trạng thái để UI admin và API response dùng cùng một logic.
 *
 * Thứ tự ưu tiên:
 * - revoked luôn đứng trước vì đây là khóa thủ công từ admin
 * - expired đứng sau revoked
 * - exhausted là hết quota
 * - còn lại là active
 */
export function getSharePassStatus(pass) {
  /**
   * Nếu admin đã revoke, pass phải hiện REVOKED
   * kể cả quota còn hay ngày hết hạn ra sao.
   */
  if (isSharePassRevoked(pass)) {
    return "REVOKED";
  }

  /**
   * Nếu chưa revoke nhưng đã quá hạn riêng của pass thì là EXPIRED.
   */
  if (isSharePassExpired(pass)) {
    return "EXPIRED";
  }

  const total = Number(pass?.quotaTotal || 0);
  const used = Number(pass?.quotaUsed || 0);

  /**
   * Hết quota là trạng thái riêng để admin dễ nhìn thấy
   * pass không còn lượt sử dụng nữa.
   */
  if (Math.max(total - used, 0) <= 0) {
    return "EXHAUSTED";
  }

  /**
   * Chỉ khi không rơi vào 3 trạng thái chặn ở trên thì mới xem là ACTIVE.
   */
  return "ACTIVE";
}
