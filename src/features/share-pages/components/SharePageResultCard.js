"use client";

function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

export default function SharePageResultCard({ result, passes }) {
  const url = result?.url;
  const downloadUrl = result?.downloadUrl;
  const downloadName = result?.downloadName || "share-passes.txt";

  return (
    <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-emerald-200">Created</div>
          <div className="text-xs text-emerald-200/70">
            Share page code:
            <span className="font-mono">{result?.sharePage?.code}</span>
          </div>
        </div>

        <a
          href={url || "#"}
          className="px-3 py-2 text-sm rounded-xl border border-emerald-900/60 hover:bg-emerald-950/40"
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>
      </div>

      <div className="rounded-xl border border-neutral-800 p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-neutral-400">URL</div>
          <div className="font-mono text-sm truncate">{url}</div>
        </div>

        <button
          type="button"
          onClick={() => copyText(url)}
          className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-[rgb(202,202,202)]"
        >
          Copy
        </button>
      </div>

      {downloadUrl ? (
        <div className="rounded-xl border border-neutral-800 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-neutral-400">Pass file</div>
            <div className="text-sm truncate">{downloadName}</div>
          </div>

          <a
            href={downloadUrl}
            download={downloadName}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-[rgb(202,202,202)]"
          >
            Download
          </a>
        </div>
      ) : null}

      <div className="text-xs text-neutral-300">
        Passes created: <b>{result?.passesCreated ?? passes?.length ?? 0}</b>
      </div>
    </div>
  );
}
