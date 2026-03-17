import SharePageForm from "@/features/share-pages/components/SharePageForm";

/**
 * Trang tạo share link mới trong khu admin.
 *
 * Trang này giờ được bọc bởi `admin/layout.js`,
 * nên không cần tự dựng outer container toàn màn hình nữa.
 */
export default function SharePageNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold">Create share link</div>
        <div className="text-sm text-neutral-400">
          Tao trang chia se voi quota va mat khau.
        </div>
      </div>

      <SharePageForm />
    </div>
  );
}
