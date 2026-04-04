/**
 * TEMPLATE MAP RESPONSE API NGOÀI -> ACCOUNT NỘI BỘ
 *
 * Mục tiêu:
 * - Bạn chủ động khai báo response thành công/thất bại nằm ở đâu.
 * - Bạn chủ động khai báo object account nằm ở đâu trong response.
 * - Bạn chủ động map field của API ngoài về schema account nội bộ của hệ thống.
 *
 * Mẫu response hiện tại mà template này đang phù hợp:
 * {
 *   "code": 200,
 *   "msg": "Lấy Thành Công",
 *   "accounts": [
 *     {
 *       "id": 1,
 *       "username": "mine02@appstoreviet.com",
 *       "password": "Asv_F3z4guNCqh",
 *       "frontend_remark": "",
 *       "message": "Bình Thường",
 *       "last_check": "2026-04-04 18:23:25",
 *       "last_check_success": 1,
 *       "check_interval": 3000,
 *       "region_display": null,
 *       "status": true
 *     }
 *   ],
 *   "status": true
 * }
 *
 * Khi API ngoài đổi format, thường bạn chỉ cần sửa file này.
 */
export const SHARE_ACCOUNT_RESPONSE_TEMPLATE = {
  /**
   * successPath:
   * - Field cho biết response tổng thể thành công hay thất bại.
   * - Với mẫu hiện tại là body.status.
   */
  successPath: "status",

  /**
   * successValue:
   * - Giá trị được coi là thành công.
   */
  successValue: true,

  /**
   * errorCodePath:
   * - Nếu API ngoài trả lỗi nghiệp vụ, mã lỗi nằm ở đâu.
   * - Với mẫu hiện tại là body.code.
   */
  errorCodePath: "code",

  /**
   * errorMessagePath:
   * - Nếu API ngoài trả lỗi nghiệp vụ, message lỗi nằm ở đâu.
   * - Với mẫu hiện tại là body.msg.
   */
  errorMessagePath: "msg",

  /**
   * dataPath:
   * - Object account chính nằm ở đâu.
   * - Vì response trả mảng accounts, và hệ thống hiện tại reveal 1 account,
   *   mình lấy phần tử đầu tiên: accounts[0].
   * - Trong mapper path đang viết dạng "accounts.0".
   */
  dataPath: "accounts.0",

  /**
   * fieldMap:
   * - Vế trái là field nội bộ của hệ thống.
   * - Vế phải là path bên trong object account của API ngoài.
   *
   * Giải thích cho mẫu hiện tại:
   * - title: tạm dùng username để nếu cần hiển thị tiêu đề thì vẫn có giá trị
   * - email: API ngoài không có field email riêng, nên map tạm bằng username
   * - username: lấy từ username
   * - password: lấy từ password
   * - note: ưu tiên lấy thông điệp vận hành từ message
   *
   * Nếu sau này API ngoài đổi key:
   * - username -> user_name
   * thì chỉ cần đổi username: "user_name"
   */
  fieldMap: {
    title: "username",
    email: "username",
    username: "username",
    password: "password",
    twoFaKey: "two_fa",
    backupCode: "backup_code",
    note: "message",
  },

  /**
   * requiredFields:
   * - Chỉ cần có ít nhất 1 trong các field này thì mapper mới coi là account hợp lệ.
   * - Với mẫu hiện tại, username và password là 2 field quan trọng nhất.
   */
  requiredFields: ["username", "password"],
};
