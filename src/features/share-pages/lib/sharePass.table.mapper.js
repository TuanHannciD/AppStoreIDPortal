import { getSharePassStatus } from "./pass-status";

/**
 * File này chịu trách nhiệm "map" dữ liệu pass từ API/server
 * sang đúng format mà bảng admin muốn dùng.
 *
 * Vì sao cần file mapper?
 * - giảm việc transform dữ liệu ngay trong component React
 * - dễ tái sử dụng nếu sau này có nhiều màn cùng hiển thị pass
 * - gom logic chuẩn hóa field về một chỗ
 */

export function mapSharePassToTableRow(item) {
  /**
   * Hàm này biến 1 record pass thành 1 row cho table.
   *
   * Những field như `status` được đảm bảo luôn có giá trị hợp lệ,
   * kể cả khi response từ API chưa gắn sẵn status.
   */
  return {
    id: item.id,
    label: item.label ?? "",
    quotaTotal: item.quotaTotal ?? 0,
    quotaUsed: item.quotaUsed ?? 0,
    quotaRemaining: item.quotaRemaining ?? 0,
    status: item.status || getSharePassStatus(item),
    revokedAt: item.revokedAt ?? null,
    reason: item.reason ?? "",
    expiresAt: item.expiresAt ?? null,
    lastVerifiedAt: item.lastVerifiedAt ?? null,
    lastRevealedAt: item.lastRevealedAt ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

export function mapSharePassesToTableRows(items = []) {
  /**
   * Map toàn bộ list pass sang list row để đưa vào React Table.
   */
  return items.map(mapSharePassToTableRow);
}
