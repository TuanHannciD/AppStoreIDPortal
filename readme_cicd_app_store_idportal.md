# AppStoreIDPortal – Hướng dẫn triển khai CI/CD bằng GitHub Actions

## 1. Mục tiêu

Tài liệu này ghi lại toàn bộ quá trình thiết lập CI/CD cho dự án **AppStoreIDPortal** đang chạy trên:

- **Next.js 14**
- **pnpm**
- **Ubuntu Server**
- **aaPanel + PM2**
- Deploy qua **GitHub Actions**
- Server public qua domain: `panel.appstoreviet.com`

Mục tiêu cuối cùng:

- Mỗi lần `push` lên nhánh `main`
- GitHub Actions sẽ chạy bước **verify**:
  - `pnpm install --frozen-lockfile`
  - `pnpm run build`
- Nếu build pass, workflow sẽ SSH vào server và chạy:
  - `./deploy.sh`

---

## 2. Kiến trúc deploy cuối cùng

### 2.1 Flow tổng quát

1. Dev code trên máy local
2. Push code lên GitHub (`main`)
3. GitHub Actions chạy job `verify`
4. Nếu `verify` pass, GitHub Actions chạy job `deploy`
5. Job `deploy` SSH vào server bằng user `deploy`
6. Server chạy script `deploy.sh`
7. Script:
   - kéo code mới
   - cài dependency bằng pnpm
   - build project
   - restart PM2 app `AppStoreIDPortal`
   - lưu PM2 process list

### 2.2 Trạng thái chuẩn sau khi hoàn tất

- Project path: `/www/wwwroot/AppStoreIDPortal`
- User deploy: `deploy`
- PM2 app chạy bởi `deploy`
- PM2 startup service: `pm2-deploy.service`
- App name trong PM2: `AppStoreIDPortal`
- App port nội bộ: `3000`
- Reverse proxy/public domain: `https://panel.appstoreviet.com`

---

## 3. Chuẩn hóa server trước khi làm CI/CD

## 3.1 Vì sao phải chuẩn hóa

Ban đầu app đã chạy được bằng cách deploy thủ công, nhưng server có nhiều tiến trình chạy lệch user:

- PM2 cũ chạy bằng `root`
- Có lúc app lại chạy tay bằng user `www`
- Repo sau đó được chuyển sang user `deploy`

Nếu không thống nhất user, sẽ dễ gặp:

- lỗi Git `dubious ownership`
- PM2 restart sai process
- port bị chiếm bởi process cũ
- file build sinh ra sai owner

### 3.2 Hướng chuẩn đã chọn

Toàn bộ flow được thống nhất theo **một user duy nhất là `deploy`**:

- Git pull/fetch/reset
- pnpm install
- pnpm build
- pm2 restart
- GitHub Actions SSH deploy

---

## 4. Cấu hình PM2 chạy cùng user `deploy`

## 4.1 Kiểm tra PM2 cũ

Đã kiểm tra và xác nhận:

- PM2 của `root` vẫn còn giữ process cũ `AppStoreIDPortal`
- PM2 của `deploy` ban đầu trống

### 4.2 Start app dưới user `deploy`

Dùng `ecosystem.config.js` để start app bằng `deploy`.

Ví dụ app được start bằng `next start`.

### 4.3 Lưu process list

Sau khi app online dưới `deploy`:

```bash
pm2 save
```

### 4.4 Tạo startup service

Dưới user `deploy`:

```bash
pm2 startup
```

PM2 in ra lệnh dạng:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
```

Chạy lệnh đó bằng `root` để tạo service:

- file service: `/etc/systemd/system/pm2-deploy.service`

Sau đó quay lại `deploy` và chạy lại:

```bash
pm2 save
```

### 4.5 Kiểm tra service

```bash
systemctl status pm2-deploy --no-pager
```

Trạng thái đúng:

- `Loaded: loaded`
- `enabled`
- `Active: active (running)`

### 4.6 Dọn PM2 cũ của root

Sau khi app chạy ổn bằng `deploy`:

```bash
pm2 delete AppStoreIDPortal
pm2 kill
```

Mục tiêu là để server chỉ còn một nguồn chạy app duy nhất: **PM2 của user `deploy`**.

---

## 5. Script deploy chuẩn trên server

File: `/www/wwwroot/AppStoreIDPortal/deploy.sh`

Nội dung chuẩn:

```bash
#!/bin/bash
set -e

cd /www/wwwroot/AppStoreIDPortal

echo "===> Fetch latest code"
git fetch origin

echo "===> Reset to origin/main"
git reset --hard origin/main

echo "===> Clean wrong npm artifacts"
rm -rf node_modules
rm -f package-lock.json

echo "===> Install dependencies with pnpm"
pnpm install --frozen-lockfile

echo "===> Build project"
pnpm run build

echo "===> Restart PM2"
pm2 restart AppStoreIDPortal --update-env || pm2 start ecosystem.config.js

echo "===> Save PM2"
pm2 save

echo "===> Done"
```

### 5.1 Vì sao dùng pnpm hoàn toàn

Ban đầu repo thực tế dùng `pnpm-lock.yaml`, nhưng script/deploy cũ lại dùng `npm ci`.

Đây là nguyên nhân lệch môi trường build/deploy.

Sau khi chuẩn hóa, toàn bộ flow đều chuyển sang:

- `pnpm install --frozen-lockfile`
- `pnpm run build`
- `pnpm start`

---

## 6. Tạo SSH key riêng cho GitHub Actions

## 6.1 Tạo key trên máy Windows

Trên PowerShell:

```powershell
ssh-keygen -t ed25519 -C "github-actions-deploy-AppStoreIDPortal" -f C:\Users\Tuan\.ssh\github_actions_deploy
```

Kết quả tạo ra:

- private key: `C:\Users\Tuan\.ssh\github_actions_deploy`
- public key: `C:\Users\Tuan\.ssh\github_actions_deploy.pub`

## 6.2 Add public key vào server

Vì user `deploy` chưa có `.ssh`, phải tạo trước:

```bash
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && touch /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
```

Sau đó add public key vào:

```bash
echo "SSH_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
```

## 6.3 Test SSH từ máy local

```powershell
ssh -i C:\Users\Tuan\.ssh\github_actions_deploy deploy@14.225.220.83
```

Nếu SSH vào được shell `deploy@...` là thành công.

---

## 7. Tạo GitHub Secrets

Trong repo GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

### 7.1 Các secret đã dùng

- `HOST_APPSTOREIDPORTAL` = `14.225.220.83`
- `USERNAME_APPSTOREIDPORTAL` = `deploy`
- `PORT_APPSTOREIDPORTAL` = `22`
- `SSH_KEY_APPSTOREIDPORTAL` = private key nhiều dòng
- `ENV_FILE_APPSTOREIDPORTAL` = toàn bộ nội dung file `.env`

### 7.2 Vì sao dùng 1 secret chứa cả `.env`

Ban đầu job `verify` bị fail vì thiếu `DATABASE_URL` trong GitHub Actions.

Thay vì tạo từng secret rời rạc, cách nhanh hơn là:

- lưu cả file `.env` vào một secret nhiều dòng
- trong workflow ghi secret này ra file `.env` trước khi build

Cách này phù hợp khi project dùng nhiều biến môi trường và cần setup nhanh.

---

## 8. File workflow GitHub Actions

File: `.github/workflows/deploy.yml`

```yaml
name: AppStoreIDPortal CI/CD

on:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Create .env file
        run: |
          cat > .env << 'EOF'
          ${{ secrets.ENV_FILE_APPSTOREIDPORTAL }}
          EOF

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build project
        run: pnpm run build

  deploy:
    runs-on: ubuntu-latest
    needs: verify

    steps:
      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST_APPSTOREIDPORTAL }}
          username: ${{ secrets.USERNAME_APPSTOREIDPORTAL }}
          port: ${{ secrets.PORT_APPSTOREIDPORTAL }}
          key: ${{ secrets.SSH_KEY_APPSTOREIDPORTAL }}
          script: |
            cd /www/wwwroot/AppStoreIDPortal
            ./deploy.sh
```

---

## 9. Quy trình test CI/CD

## 9.1 Commit workflow riêng

Để tránh đẩy lẫn file không liên quan, chỉ add workflow file trước:

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
git push origin main
```

## 9.2 Theo dõi workflow

Vào:

- GitHub repo
- tab **Actions**
- mở workflow `AppStoreIDPortal CI/CD`

Kiểm tra:

- `verify`
- `deploy`

---

## 10. Các lỗi đã gặp và cách xử lý

## 10.1 Lỗi: dùng npm trong khi repo dùng pnpm

### Triệu chứng

- repo có `pnpm-lock.yaml`
- script deploy hoặc CI lại dùng `npm ci`

### Nguyên nhân

Lockfile và package manager không khớp.

### Cách xử lý

Chuẩn hóa toàn bộ sang `pnpm`:

- server
- deploy.sh
- GitHub Actions

---

## 10.2 Lỗi TypeScript khi build trên server

### Triệu chứng

Build fail ở:

- `src/components/ui/dropdown-menu.tsx`
- `DropdownMenuPrimitive.RadioItem`
- thiếu prop `value`

### Kết luận

Đây **không phải lỗi môi trường server**, vì sau khi làm sạch local để giống server bằng:

```powershell
Remove-Item -Recurse -Force node_modules, .next
Remove-Item -Force package-lock.json
pnpm install --frozen-lockfile
pnpm run build
```

local cũng lỗi y hệt server.

### Cách xử lý

Sửa code theo đúng type contract của Radix hiện tại.

---

## 10.3 Lỗi Git: `detected dubious ownership in repository`

### Triệu chứng

Khi chạy `./deploy.sh` bằng `root`:

```text
fatal: detected dubious ownership in repository at '/www/wwwroot/AppStoreIDPortal'
```

### Nguyên nhân

User chạy Git và user sở hữu repo không khớp.

### Cách xử lý thực tế

Không tiếp tục dùng root cho deploy nữa.

Chuyển toàn bộ flow sang user `deploy` để tránh lệch owner.

---

## 10.4 Lỗi PM2 startup service fail

### Triệu chứng

`systemctl start pm2-deploy` fail với kiểu:

```text
The service did not take the steps required by its unit configuration.
```

và:

```text
Failed with result 'protocol'
```

### Nguyên nhân

PM2 daemon của user `deploy` đã được chạy tay trước đó, làm `systemd` không khởi tạo đúng daemon như nó mong đợi.

### Cách xử lý

Dưới user `deploy`:

```bash
pm2 kill
```

Sau đó start lại service bằng `root`:

```bash
systemctl start pm2-deploy
```

---

## 10.5 Lỗi app `errored` trong PM2 vì `EADDRINUSE`

### Triệu chứng

PM2 app dưới `deploy` báo:

```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

### Nguyên nhân

Port `3000` đang bị process khác giữ.

Kiểm tra ra thấy:

- process `next-server`
- user `www`
- parent process là `npm run start`

Tức là có **process cũ chạy tay** ngoài PM2 đang giữ port.

### Cách xử lý

Xác định parent PID rồi kill process đó:

```bash
kill <parent_pid>
```

Sau đó restart lại app trong PM2 `deploy`:

```bash
pm2 restart AppStoreIDPortal
pm2 save
```

---

## 10.6 Lỗi GitHub Actions build fail vì thiếu env

### Triệu chứng

Trong job `verify`:

```text
Error: Missing DATABASE_URL
Error: Failed to collect page data for /api/account-sources/[id]/run-now
```

### Nguyên nhân

`next build` chạm đến logic cần env/DB, nhưng GitHub Actions chưa có biến môi trường.

### Cách xử lý

Tạo secret chứa cả file `.env`:

- `ENV_FILE_APPSTOREIDPORTAL`

Và thêm step tạo `.env` trước khi build.

---

## 10.7 Workflow báo deploy thành công nhưng web không thấy đổi

### Triệu chứng

GitHub Actions báo:

```text
✅ Successfully executed commands to all host.
```

Nhưng truy cập website vẫn không thấy thay đổi.

### Cách kiểm tra đã làm

#### a. So sánh commit local/server

Dùng:

```bash
git rev-parse HEAD
```

Kết quả xác nhận:

- local = server = origin/main

Tức là server đã lấy đúng commit mới.

#### b. Kiểm tra app nội bộ

```bash
curl -I http://127.0.0.1:3000
```

App Next.js trên server chạy bình thường.

#### c. Tìm text mới trong source

```bash
grep -R "Đây là test CI/CD" /www/wwwroot/AppStoreIDPortal/src /www/wwwroot/AppStoreIDPortal/app 2>/dev/null
```

Text mới có trong source trên server.

#### d. So sánh localhost với domain

Localhost có text mới:

```bash
curl -s http://127.0.0.1:3000/ | grep "Đây là test CI/CD"
```

Domain cũ không thấy ngay, nhưng khi thêm query string cache-busting thì thấy:

```bash
curl -s "https://panel.appstoreviet.com/?v=$(date +%s)" | grep "Đây là test CI/CD"
```

### Kết luận

Deploy thành công. Vấn đề là **cache của URL gốc `/`** ở lớp browser/CDN/proxy.

### Cách xử lý

- hard refresh
- mở tab ẩn danh
- thêm query string test
- purge cache Cloudflare
- kiểm tra cache rule của Cloudflare / proxy

---

## 11. Cách kiểm tra nhanh khi nghi ngờ deploy không lên

Làm theo thứ tự này:

### 11.1 Kiểm tra commit trên server

```bash
cd /www/wwwroot/AppStoreIDPortal && git rev-parse HEAD
```

### 11.2 Kiểm tra PM2

```bash
pm2 list
pm2 logs AppStoreIDPortal --lines 50
```

### 11.3 Kiểm tra app nội bộ

```bash
curl -I http://127.0.0.1:3000
```

### 11.4 Kiểm tra domain public

```bash
curl -I https://panel.appstoreviet.com/
```

### 11.5 Kiểm tra text mới có trong source không

```bash
grep -R "TEXT_MOI" /www/wwwroot/AppStoreIDPortal/src /www/wwwroot/AppStoreIDPortal/app 2>/dev/null
```

### 11.6 Kiểm tra text mới có trong HTML nội bộ không

```bash
curl -s http://127.0.0.1:3000/ | grep "TEXT_MOI"
```

### 11.7 Kiểm tra text mới có trong domain public không

```bash
curl -s "https://panel.appstoreviet.com/?v=$(date +%s)" | grep "TEXT_MOI"
```

---

## 12. Checklist chuẩn mỗi lần deploy sau này

## 12.1 Trước khi push

- đã commit code cần deploy
- local build pass
- không còn sửa dở trong file quan trọng

## 12.2 Sau khi push

- vào GitHub Actions xem `verify` pass
- xem `deploy` pass
- kiểm tra PM2:

```bash
pm2 list
```

- kiểm tra domain
- nếu không thấy đổi, test URL có query string:

```text
https://panel.appstoreviet.com/?v=123456
```

## 12.3 Nếu vẫn chưa thấy đổi

- so commit local/server
- xem log PM2
- curl localhost
- kiểm tra cache Cloudflare

---

## 13. Khuyến nghị bảo mật

Trong quá trình setup, private key SSH đã từng bị lộ ra ngoài màn hình chat.

Vì vậy nên làm lại bước này để an toàn:

1. tạo cặp SSH key mới
2. thay public key trong `/home/deploy/.ssh/authorized_keys`
3. cập nhật lại GitHub Secret `SSH_KEY_APPSTOREIDPORTAL`
4. xóa key cũ

---

## 14. Kết luận

Sau khi hoàn thành toàn bộ các bước trên, hệ thống đã đạt trạng thái vận hành chuẩn:

- CI/CD hoạt động tự động qua GitHub Actions
- server deploy bằng user `deploy`
- PM2 chạy ổn định bằng `pm2-deploy.service`
- build dùng `pnpm` thống nhất giữa local, CI và server
- đã có quy trình kiểm tra lỗi rõ ràng khi deploy không lên hoặc web không đổi ngay

Từ thời điểm này, workflow chuẩn là:

1. code
2. commit
3. push `main`
4. GitHub Actions verify
5. GitHub Actions SSH deploy
6. PM2 restart
7. kiểm tra web + cache nếu cần

