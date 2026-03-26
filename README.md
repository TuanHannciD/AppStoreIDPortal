# Appstoreviet ID Portal

Portal quản lý và chia sẻ Apple ID/App account theo 2 phần chính:

- `Admin`: quản lý app, app account, nguồn sync, share page và pass
- `Public/User`: truy cập link `/share/[code]`, nhập pass, xác thực token và reveal thông tin tài khoản theo quota

Project dùng Next.js App Router, Prisma và PostgreSQL.

## Stack

- Next.js 14
- React 18
- Prisma
- PostgreSQL
- Tailwind CSS
- Zod
- Lucide React

## Tính năng hiện có

### Admin

- Đăng nhập admin
- Quản lý app
- Quản lý app account
- Quản lý share page
- Quản lý share pass
- Gán account vào share page
- Cron/sync account từ API source
- Log xóa cho app, share page, share pass, app account

### Public share flow

- Truy cập link `/share/[code]`
- Load metadata public của share page
- Nhập pass để verify
- Sinh verification token ngắn hạn
- Validate token khi reload/truy cập lại
- Reveal account ở bước riêng
- Consume quota tại bước reveal
- Token hết hạn hoặc invalid thì quay lại màn nhập pass

## Cấu trúc thư mục

```text
src/
  app/
    (admin)/admin/...                  # màn admin
    (public)/page.js                   # home public
    (public)/share/[code]/page.js      # màn share public
    api/...                            # route handlers
  components/                          # shared components
  features/
    share-public/                      # flow public share
    apps/                              # admin app management
    app-accounts/                      # admin account management
    share-pages/                       # admin share page management
    account-sources/                   # cấu hình API source / cron
  lib/                                 # prisma, auth, helpers
prisma/
  schema.prisma
  migrations/
scripts/
```

## Yêu cầu môi trường

- Node.js 18+
- PostgreSQL
- npm hoặc pnpm

## Cài đặt local

1. Cài dependencies

```bash
npm install
```

2. Tạo file môi trường

Project đang dùng `.env`. Hãy cấu hình tối thiểu:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your-secret
```

Nếu project của bạn đang có thêm biến khác trong `.env`, giữ nguyên các biến đó.

3. Generate Prisma client và migrate database

```bash
npx prisma generate
npx prisma migrate deploy
```

Nếu đang phát triển local với schema mới:

```bash
npx prisma migrate dev
```

4. Chạy dev server

```bash
npm run dev
```

App mặc định chạy tại:

- `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Tạo nhanh tài khoản admin

Nếu cần render nhanh dữ liệu admin để import vào database:

```bash
npm run render:admin-account -- --email admin@example.com --password your-password --format sql
```

File đầu ra mặc định:

- `tmp/admin-user.sql`

Có thể đổi sang JSON hoặc đổi đường dẫn output bằng `--format` và `--out`.

## Public routes chính

- `/`
  Home public

- `/share/[code]`
  Màn user/public để truy cập share page

## Admin routes chính

- `/login`
  Đăng nhập admin

- `/admin`
  Dashboard admin

- `/admin/apps`
  Quản lý app

- `/admin/accounts`
  Quản lý app account

- `/admin/share-pages`
  Quản lý share page và pass

- `/admin/account-sources`
  Quản lý nguồn API sync account

## API public share flow

- `GET /api/share-pages/by-code/[code]`
  Lấy metadata public của share page

- `POST /api/share-pages/by-code/[code]/verify`
  Verify pass và tạo verification token

- `POST /api/share-pages/by-code/[code]/validate`
  Kiểm tra token còn hợp lệ trước khi cho qua bước reveal

- `POST /api/share-pages/by-code/[code]/reveal`
  Reveal thông tin account và consume quota

## Mô hình dữ liệu chính

Các thực thể quan trọng trong `prisma/schema.prisma`:

- `User`
- `App`
- `AppAccount`
- `ApiSourceConfig`
- `SharePage`
- `SharePass`
- `SharePassVerification`
- `SharePageAccount`
- `ShareAuthLog`

Một số nguyên tắc nghiệp vụ hiện tại:

- `verify` không consume quota
- `reveal` mới consume quota
- token verify có hạn ngắn
- token có thể bị invalid, expired hoặc consumed
- reload trang sẽ validate lại token với server

## Lưu ý khi phát triển

- Public share flow hiện là phần nhạy cảm nhất của hệ thống, nên mọi thay đổi liên quan `verify / validate / reveal` cần test kỹ
- Không nên tin trạng thái token ở client; backend là nguồn sự thật
- Nếu đổi TTL token ở backend, hãy kiểm tra lại flow validate và reveal ở frontend
- Project có thể đang có thay đổi cục bộ trong worktree, kiểm tra `git status` trước khi commit

## Kiểm tra nhanh trước khi commit

```bash
npm run lint
```

Nếu thay đổi schema:

```bash
npx prisma generate
```

## Ghi chú triển khai

Nếu deploy bằng process manager như PM2, bạn có thể chạy app production sau khi build:

```bash
npm run build
npm run start
```

Hoặc tích hợp với quy trình riêng của server/CI-CD hiện tại.
