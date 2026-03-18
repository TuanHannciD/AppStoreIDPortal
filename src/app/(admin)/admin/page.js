import Link from "next/link";
import { getCurrentAdminSession } from "@/lib/admin-session";

const featureCards = [
  {
    title: "Quản lý Share Links",
    description:
      "Theo dõi danh sách link chia sẻ, kiểm tra trạng thái, quota và mở nhanh các hành động quản trị cần thiết.",
    href: "/admin/share-pages",
    cta: "Mở danh sách share links",
  },
  {
    title: "Tạo Share Link mới",
    description:
      "Tạo nhanh một trang chia sẻ mới, cấu hình thời hạn, quota mặc định và các thông số phục vụ luồng cấp quyền.",
    href: "/admin/share-pages/new",
    cta: "Tạo share link",
  },
  {
    title: "Quản lý App Accounts",
    description:
      "Quản trị danh sách tài khoản thật của từng app để gắn vào share page và kiểm soát dữ liệu nội bộ tốt hơn.",
    href: "/admin/accounts",
    cta: "Mở danh sách tài khoản",
  },
];

const quickGuides = [
  {
    title: "Bắt đầu từ đâu",
    body: "Nếu đang thiết lập mới, hãy tạo app account trước, sau đó tạo share link và gắn account phù hợp vào share page.",
  },
  {
    title: "Quản lý pass",
    body: "Trong danh sách share links, bạn có thể mở modal quản lý pass để theo dõi quota, trạng thái hết hạn, thu hồi hoặc hết lượt sử dụng.",
  },
  {
    title: "Theo dõi vận hành",
    body: "Ưu tiên kiểm tra các pass bị revoke, expired hoặc exhausted để xử lý sớm các tình huống gián đoạn cho người dùng cuối.",
  },
];

export default async function AdminHomePage() {
  const currentAdmin = await getCurrentAdminSession();
  const welcomeName = currentAdmin?.email || "quản trị viên";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            Admin Home
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Chào mừng, {welcomeName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
            Đây là khu vực quản trị trung tâm của hệ thống App Store ID Portal.
            Từ đây bạn có thể quản lý share link, pass truy cập và các tài khoản
            app nội bộ đang được phân phối cho từng luồng chia sẻ.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Vai trò hiện tại</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {currentAdmin?.role || "ADMIN"} đang đăng nhập và sử dụng khu vực quản trị.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Mục tiêu hệ thống</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tổ chức việc chia sẻ account theo app, theo share page và theo pass
              để dễ kiểm soát quota cũng như lịch sử sử dụng.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Cách làm việc</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Dùng menu bên trái để điều hướng nhanh giữa các màn hình quản trị và
              thao tác theo đúng luồng nghiệp vụ hiện có.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Các chức năng hiện có
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Một vài lối đi nhanh để bạn bắt đầu công việc quản trị ngay sau khi đăng nhập.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {featureCards.map((item) => (
              <div
                key={item.href}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="text-base font-semibold text-slate-900">{item.title}</div>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Hướng dẫn cơ bản
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Gợi ý ngắn để thao tác nhanh và hạn chế sai sót khi quản lý dữ liệu.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {quickGuides.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
