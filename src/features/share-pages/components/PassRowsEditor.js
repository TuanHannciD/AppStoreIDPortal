"use client";

export default function PassRowsEditor({
  mode,
  inputMode = "file",
  passes,
  onChange,
  passFile,
  passFileError,
  fileInputRef,
  onPassFileChange,
  onPassFileRemove,
  autoGenCount,
  autoGenQuota,
  onAutoGenCountChange,
  onAutoGenQuotaChange,
  onGenerateAutoPasses,
  autoGenDownloadUrl,
  autoGenDownloadName,
  fileAccept,
}) {
  const isSingle = mode === "single";
  const isFileMode = !isSingle && inputMode === "file";
  const isAutoGenMode = !isSingle && inputMode === "autogen";

  function updateRow(idx, patch) {
    const next = passes.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Passes & Quota</div>
          <div className="text-xs text-neutral-400">
            Quota chỉ bị giảm khi thông tin tài khoản được hiển thị thành công.
          </div>
        </div>

        {isFileMode && (
          <button
            type="button"
            onClick={() => fileInputRef?.current?.click()}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
          >
            Chọn file txt
          </button>
        )}
      </div>

      {isFileMode ? (
        <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            onChange={onPassFileChange}
            className="hidden"
          />

          <div className="text-xs text-neutral-400">
            Định dạng hợp lệ: `Password|quota|label`. Label có thể trống, quota bắt buộc là số.
          </div>

          {passFile ? (
            <div className="rounded-xl border border-neutral-700 bg-neutral-950/30 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{passFile.name}</div>
                <div className="text-xs text-neutral-400">
                  {(passFile.size / 1024).toFixed(2)} KB, {passes.length} pass hợp lệ
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
                >
                  Gắn lại file
                </button>
                <button
                  type="button"
                  onClick={onPassFileRemove}
                  className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
                >
                  Gỡ file
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700 p-4 text-sm text-neutral-300">
              Chưa có file nào được gắn.
            </div>
          )}

          {passFileError ? <div className="text-xs text-red-300">{passFileError}</div> : null}
        </div>
      ) : null}

      {isAutoGenMode ? (
        <div className="rounded-xl border border-neutral-800 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-neutral-400">Số lượng pass *</div>
              <input
                value={autoGenCount}
                onChange={(e) => onAutoGenCountChange(e.target.value)}
                type="number"
                min="1"
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-neutral-400">Quota mỗi pass *</div>
              <input
                value={autoGenQuota}
                onChange={(e) => onAutoGenQuotaChange(e.target.value)}
                type="number"
                min="1"
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateAutoPasses}
              className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
            >
              Tạo file txt
            </button>

            {autoGenDownloadUrl ? (
              <a
                href={autoGenDownloadUrl}
                download={autoGenDownloadName}
                className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
              >
                Tải file pass
              </a>
            ) : null}
          </div>

          <div className="text-xs text-neutral-400">
            Sau khi tạo, hệ thống sẽ lưu danh sách pass vào form và tạo file txt để tải xuống.
          </div>

          {passFileError ? <div className="text-xs text-red-300">{passFileError}</div> : null}
        </div>
      ) : null}

      {(isSingle || isAutoGenMode) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="text-left">
                <th className="py-2 pr-3">Pass</th>
                <th className="py-2 pr-3 w-40">Quota</th>
                <th className="py-2 pr-3">Label (optional)</th>
                <th className="py-2 w-16"></th>
              </tr>
            </thead>

            <tbody>
              {passes.map((row, idx) => (
                <tr key={idx} className="border-t border-neutral-800">
                  <td className="py-2 pr-3">
                    <input
                      value={row.pass}
                      disabled={isAutoGenMode}
                      onChange={(e) => updateRow(idx, { pass: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600 disabled:opacity-70"
                      placeholder="e.g. user-abc-001"
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <input
                      value={row.quota}
                      disabled={isAutoGenMode}
                      onChange={(e) => updateRow(idx, { quota: e.target.value })}
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600 text-right disabled:opacity-70"
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <input
                      value={row.label || ""}
                      disabled={isAutoGenMode}
                      onChange={(e) => updateRow(idx, { label: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600 disabled:opacity-70"
                      placeholder="User A (optional)"
                    />
                  </td>

                  <td className="py-2 text-right">
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isSingle && (
        <div className="text-xs text-neutral-400">
          Chế độ Single chỉ cho phép một pass.
        </div>
      )}
    </div>
  );
}
