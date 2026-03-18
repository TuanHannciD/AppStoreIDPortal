# JWT Admin Auth Flow

Tài liệu này mô tả luồng đăng nhập admin hiện tại, cách JWT được ký và verify, các biến môi trường liên quan, cùng một số bước debug khi token lỗi.

## 1. Mục tiêu thiết kế

- Middleware phải tự verify được token mà không cần Prisma.
- Chỉ cho `ADMIN` hoặc `SUPER_ADMIN` đi qua khu `/admin`.
- Token được giữ trong `httpOnly cookie`.
- Có một tài liệu riêng để lần lại flow khi cần debug.

## 2. Luồng xử lý hiện tại

### Đăng nhập

File chính: `src/app/api/login/route.js`

1. User gửi `email` và `password`.
2. API query DB bằng Prisma để lấy user.
3. Password nhập vào được hash bằng `sha256`.
4. Chỉ user có role `ADMIN` hoặc `SUPER_ADMIN` mới được phép đi tiếp.
5. Server tạo JWT và set vào cookie `admin_access_token`.

### Middleware bảo vệ khu admin

File chính: `src/middleware.js`

1. Middleware chạy trước khi vào page admin hoặc API admin.
2. Middleware đọc cookie `admin_access_token`.
3. Middleware verify:
   - token có tồn tại không
   - chữ ký có đúng không
   - issuer có đúng không
   - token có hết hạn không
   - role có phải admin không
4. Nếu hợp lệ thì request được đi tiếp.
5. Nếu không hợp lệ:
   - page admin bị redirect về `/login`
   - API admin trả `401 Unauthorized`

### Server component admin

File ví dụ: `src/app/(admin)/admin/page.js`

1. Server component đọc lại cookie hiện tại.
2. Verify token bằng helper dùng chung.
3. Lấy `email` và `role` từ payload để hiển thị.

## 3. Cấu trúc payload JWT

```json
{
  "sub": "user_id",
  "email": "admin@example.com",
  "role": "SUPER_ADMIN",
  "iss": "appstore-id-portal-ui",
  "iat": 1710000000,
  "exp": 1710028800
}
```

Ý nghĩa:

- `sub`: id user
- `email`: email dùng cho lời chào và context giao diện
- `role`: quyền của admin
- `iss`: issuer của token
- `iat`: thời điểm phát hành
- `exp`: thời điểm hết hạn

## 4. Loại chữ ký đang dùng

Hệ thống hiện dùng:

- `HS256` = HMAC SHA-256

Lý do chọn:

- middleware edge verify được
- triển khai đơn giản
- phù hợp cho admin portal nội bộ

## 5. Cấu hình trong `.env`

```env
AUTH_JWT_ALGORITHM=HS256
AUTH_JWT_SECRET=change-this-admin-jwt-secret-before-production
AUTH_JWT_ISSUER=appstore-id-portal-ui
AUTH_JWT_EXPIRES_IN_SEC=28800
```

Ý nghĩa:

- `AUTH_JWT_ALGORITHM`: thuật toán ký. Hiện helper đang dùng `HS256`.
- `AUTH_JWT_SECRET`: secret dùng để ký và verify JWT.
- `AUTH_JWT_ISSUER`: dấu nhận diện token của hệ thống.
- `AUTH_JWT_EXPIRES_IN_SEC`: thời hạn token, tính bằng giây.

## 6. Cách debug khi token lỗi

### Luôn bị đá về `/login`

Kiểm tra:

1. Cookie `admin_access_token` có được set sau login chưa.
2. `AUTH_JWT_SECRET` có bị đổi sau khi token đã phát hành không.
3. `AUTH_JWT_ISSUER` có đang khớp với token không.
4. Token có hết hạn theo `exp` chưa.
5. Payload có còn role `ADMIN` hoặc `SUPER_ADMIN` không.

### API admin trả `401`

Kiểm tra:

1. Request có gửi kèm cookie không.
2. Route có nằm trong matcher của middleware không.
3. Cookie có phải token cũ hoặc token hỏng không.

### Login thành công nhưng vào admin vẫn lỗi

Kiểm tra:

1. Cookie name phải là `admin_access_token`.
2. Secret dùng ở login và secret dùng ở middleware phải là cùng một giá trị.
3. Server đã reload lại `.env` sau khi đổi cấu hình chưa.
4. `AUTH_JWT_EXPIRES_IN_SEC` có bị đặt quá ngắn không.

## 7. Điều cần nhớ khi đổi cấu hình

- Đổi `AUTH_JWT_SECRET` sẽ làm toàn bộ token cũ mất hiệu lực.
- Đổi `AUTH_JWT_ISSUER` cũng làm token cũ không còn verify được.
- Giảm `AUTH_JWT_EXPIRES_IN_SEC` sẽ làm user bị logout sớm hơn.
- Nếu sau này cần revoke session tốt hơn, có thể bổ sung refresh token hoặc token version trong DB.
