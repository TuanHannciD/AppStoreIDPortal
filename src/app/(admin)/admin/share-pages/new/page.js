import SharePageForm from "@/features/share-pages/components/SharePageForm";

//Đây là page component trong Next.js dùng để hiển thị trang tạo share link mới. Nó chủ yếu làm nhiệm vụ render layout và nhúng SharePageForm
export default function SharePageNewPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <div className="text-xl font-semibold">Create share link</div>
          <div className="text-sm text-neutral-400">
            Tạo trang chia sẻ với quota và mật khẩu.
          </div>
        </div>

        <SharePageForm />
      </div>
    </div>
  );
}
