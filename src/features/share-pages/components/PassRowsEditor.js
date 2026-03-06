"use client";

//Component này là UI editor để nhập danh sách pass. Nó cho người dùngxem các pass hiện có sửa pass, quota, label thêm dòng mới xóa dòng khóa việc thêm/xóa khi đang ở single mode
export default function PassRowsEditor({ mode, passes, onChange }) {
  const isSingle = mode === "single";

  function updateRow(idx, patch) {
    const next = passes.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...passes, { pass: "", quota: 1, label: "" }]);
  }

  function removeRow(idx) {
    const next = passes.filter((_, i) => i !== idx);
    onChange(next.length ? next : [{ pass: "", quota: 1, label: "" }]);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Passes & Quota</div>
          <div className="text-xs text-neutral-400">
            Each pass represents one user; every valid use decrements quota.
          </div>
        </div>

        {!isSingle && (
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-800"
          >
            Add pass
          </button>
        )}
      </div>

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
                    onChange={(e) => updateRow(idx, { pass: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                    placeholder="e.g. user-abc-001"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={row.quota}
                    onChange={(e) => updateRow(idx, { quota: e.target.value })}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600 text-right"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={row.label || ""}
                    onChange={(e) => updateRow(idx, { label: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                    placeholder="User A (optional)"
                  />
                </td>
                <td className="py-2 text-right">
                  {!isSingle && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="px-2 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSingle && (
        <div className="text-xs text-neutral-400">
          Single mode: one pass only. Switch to multiple mode to add more.
        </div>
      )}
    </div>
  );
}
