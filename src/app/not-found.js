import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đường dẫn bạn vừa mở không tồn tại hoặc đã bị gỡ khỏi hệ thống.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Về trang đăng nhập
          </Link>
          <Link
            href="/admin/share-pages"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Mở khu share links
          </Link>
        </div>
      </div>
    </div>
  );
}
