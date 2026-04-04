"use client";

function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

export default function ShareLinkResultCard({ result, passes }) {
  const url = result?.url;
  const downloadUrl = result?.downloadUrl;
  const downloadName = result?.downloadName || "share-passes.txt";

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-200">
            Tạo share link thành công
          </div>
          <div className="text-xs text-emerald-200/70">
            Mã share link:{" "}
            <span className="font-mono">{result?.shareLink?.code}</span>
          </div>
        </div>

        <a
          href={url || "#"}
          className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-900/60 px-3 py-2 text-sm hover:bg-emerald-950/40 sm:w-auto"
          target="_blank"
          rel="noreferrer"
        >
          Mở link
        </a>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-neutral-400">URL</div>
          <div className="truncate font-mono text-sm">{url}</div>
        </div>

        <button
          type="button"
          onClick={() => copyText(url)}
          className="w-full rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-[rgb(202,202,202)] sm:w-auto"
        >
          Sao chép
        </button>
      </div>

      {downloadUrl ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-neutral-400">File pass</div>
            <div className="truncate text-sm">{downloadName}</div>
          </div>

          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-[rgb(202,202,202)] sm:w-auto"
          >
            Tải file pass
          </a>
        </div>
      ) : null}

      <div className="text-xs text-neutral-300">
        Số pass đã tạo: <b>{result?.passesCreated ?? passes?.length ?? 0}</b>
      </div>
    </div>
  );
}
