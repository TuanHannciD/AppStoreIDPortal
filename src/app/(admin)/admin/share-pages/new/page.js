import PageHeader from "@/components/PageHeader";
import SharePageForm from "@/features/share-pages/components/SharePageForm";

/**
 * Trang tạo share link mới trong khu admin.
 *
 * Trang này giờ được bọc bởi `admin/layout.js`,
 * nên không cần tự dựng outer container toàn màn hình nữa.
 */
export default function SharePageNewPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="space-y-6">
          <PageHeader
            title="Tạo mới share link"
            subtitle="Tạo trang chia sẻ với quota và mật khẩu."
          />
          <SharePageForm />
        </div>
      </div>
    </div>
  );
}
