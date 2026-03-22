# App Store ID Portal (UI Skeleton)

Production-style UI skeleton for a customer self-service portal to view rental package/quota and  App Store ID credentials.

## Tech
- Next.js (App Router)
- React
- JavaScript (no TypeScript)
- Tailwind CSS
- Mock data + mock API route handlers

## Run locally

```bash
npm install
npm run dev
```

## Ghi chú nội bộ

Nếu cần tạo nhanh tài khoản admin để thêm thủ công vào database, dùng:

```bash
npm run render:admin-account -- --email admin@example.com --password your-password --format sql
```

Lệnh trên sẽ sinh file SQL tại `tmp/admin-user.sql`. Bạn cũng có thể đổi sang `--format json` hoặc truyền `--out` để đổi đường dẫn file đầu ra.
