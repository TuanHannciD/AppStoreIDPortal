"use client";

// CHANGED:
// Component này dùng để nhập và quản lý danh sách pass của một share link.
// Người dùng có thể:
// - xem các pass hiện có
// - sửa pass / quota / label
// - thêm dòng mới
// - xóa dòng
// - bị khóa thêm/xóa khi đang ở single mode
//
// Lưu ý business mới:
// - verify pass KHÔNG trừ quota
// - chỉ khi user bấm xem thông tin account thành công thì quota mới bị trừ
export default function PassRowsEditor({ mode, passes, onChange }) {
  // CHANGED:
  // Single mode chỉ cho phép tồn tại đúng 1 pass.
  // Khi ở mode này, UI sẽ không cho add/remove row.
  const isSingle = mode === "single";

  // Cập nhật 1 dòng pass theo index
  function updateRow(idx, patch) {
    const next = passes.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  }

  // Thêm một dòng pass mới
  function addRow() {
    onChange([...passes, { pass: "", quota: 1, label: "" }]);
  }

  // Xóa một dòng pass
  // CHANGED:
  // Nếu xóa hết tất cả thì vẫn giữ lại 1 dòng rỗng mặc định
  // để tránh UI rơi vào trạng thái không còn row nào để nhập.
  function removeRow(idx) {
    const next = passes.filter((_, i) => i !== idx);
    onChange(next.length ? next : [{ pass: "", quota: 1, label: "" }]);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Passes & Quota</div>

          {/* CHANGED:
              Sửa mô tả cũ:
              "every valid use decrements quota"
              vì câu đó không còn đúng với flow mới nữa.
              Giờ quota chỉ bị trừ khi reveal account thành công. */}
          <div className="text-xs text-neutral-400">
            Mỗi lượt truy cập đại diện cho một người dùng; quota chỉ bị giảm khi
            thông tin tài khoản bị tiết lộ.
          </div>
        </div>

        {!isSingle && (
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-700 hover:bg-neutral-400"
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
                      className="px-2 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-400"
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
          {/* CHANGED:
              Chỉ sửa wording cho rõ hơn một chút, logic giữ nguyên */}
          Single mode: Chỉ cho phép một lần nhập liệu. Chuyển sang chế độ nhiều
          lần nhập liệu để thêm. more.
        </div>
      )}
    </div>
  );
}
