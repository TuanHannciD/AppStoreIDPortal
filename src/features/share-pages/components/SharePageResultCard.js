"use client";

// Hàm tiện ích để copy text vào clipboard
function copyText(text) {
  // Nếu text rỗng thì không làm gì
  if (!text) return;

  // navigator.clipboard là Web API để copy vào clipboard
  // ?. là optional chaining để tránh lỗi nếu browser không hỗ trợ
  navigator.clipboard?.writeText(text);
}

// Component hiển thị kết quả sau khi tạo share page
// props:
// - result: dữ liệu trả về từ API sau khi tạo share page
// - passes: danh sách pass đã tạo trong form
export default function SharePageResultCard({ result, passes }) {
  // Lấy URL từ kết quả API
  const url = result?.url;

  return (
    // Card hiển thị kết quả
    <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Thông tin share page */}
        <div>
          <div className="text-sm font-semibold text-emerald-200">Created</div>

          {/* Hiển thị code của share page */}
          <div className="text-xs text-emerald-200/70">
            Share page code:
            <span className="font-mono">{result?.sharePage?.code}</span>
          </div>
        </div>

        {/* Nút mở share page trong tab mới */}
        <a
          href={url || "#"} // nếu url null thì dùng "#"
          className="px-3 py-2 text-sm rounded-xl border border-emerald-900/60 hover:bg-emerald-950/40"
          target="_blank" // mở tab mới
          rel="noreferrer" // bảo mật
        >
          Open
        </a>
      </div>

      {/* Khối hiển thị URL share */}
      <div className="rounded-xl border border-neutral-800 p-3 flex items-center justify-between gap-3">
        {/* URL hiển thị */}
        <div className="min-w-0">
          {/* Label */}
          <div className="text-xs text-neutral-400">URL</div>

          {/* URL thật (font monospace) */}
          {/* truncate giúp text dài không vỡ layout */}
          <div className="font-mono text-sm truncate">{url}</div>
        </div>

        {/* Nút copy URL */}
        <button
          type="button"
          onClick={() => copyText(url)}
          className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-[rgb(202,202,202)]"
        >
          Copy
        </button>
      </div>

      {/* Hiển thị số pass đã tạo */}
      <div className="text-xs text-neutral-300">
        Passes created:
        <b>
          {/* Ưu tiên số pass trả về từ API */}
          {result?.passesCreated ?? passes?.length ?? 0}
        </b>
      </div>
    </div>
  );
}
