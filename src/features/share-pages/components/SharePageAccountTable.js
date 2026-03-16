"use client";

import { useMemo } from "react";

/**
 * SharePageAccountTable
 *
 * Mục tiêu:
 * - Hiển thị danh sách account thuộc app đang chọn
 * - Cho admin multi-select account để gắn vào SharePage
 * - Chỉ là component UI + selection logic, không gọi API ở đây
 *
 * Props:
 * - accounts: danh sách account đã load từ API
 * - selectedIds: mảng id account đang được chọn
 * - onChangeSelectedIds: callback cập nhật selection ra ngoài form cha
 * - loading: trạng thái đang tải account
 * - keyword: từ khóa tìm kiếm
 * - onKeywordChange: callback đổi keyword
 */
export default function SharePageAccountTable({
  accounts = [],
  selectedIds = [],
  onChangeSelectedIds,
  loading = false,
  keyword = "",
  onKeywordChange,
}) {
  /**
   * Lọc account theo từ khóa tìm kiếm.
   * Có thể tìm theo email, username hoặc note.
   */
  const filteredAccounts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return accounts;

    return accounts.filter((item) => {
      const haystack = [item.email, item.username, item.note, item.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [accounts, keyword]);

  /**
   * Tập account đang hiển thị và có thể chọn.
   * Ở đây tôi chỉ cho phép chọn account active.
   */
  const selectableVisibleIds = useMemo(() => {
    return filteredAccounts
      .filter((item) => item.isActive !== false)
      .map((item) => item.id);
  }, [filteredAccounts]);

  const allVisibleSelected =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((id) => selectedIds.includes(id));

  function toggleOne(id) {
    const exists = selectedIds.includes(id);

    if (exists) {
      onChangeSelectedIds(selectedIds.filter((x) => x !== id));
      return;
    }

    onChangeSelectedIds([...selectedIds, id]);
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      // Bỏ chọn tất cả account đang nhìn thấy
      onChangeSelectedIds(
        selectedIds.filter((id) => !selectableVisibleIds.includes(id)),
      );
      return;
    }

    // Gộp selected hiện tại + toàn bộ account visible
    const next = new Set([...selectedIds, ...selectableVisibleIds]);
    onChangeSelectedIds(Array.from(next));
  }

  function clearAll() {
    onChangeSelectedIds([]);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Assigned Accounts</div>
          <div className="text-xs text-neutral-400 mt-1">
            Chọn một hoặc nhiều account từ app hiện tại để user có thể reveal
            sau khi verify pass thành công.
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          {selectedIds.length} selected / {accounts.length} accounts
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={keyword}
          onChange={(e) => onKeywordChange?.(e.target.value)}
          placeholder="Search email, username, note..."
          className="w-full md:max-w-sm rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAllVisible}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-800 hover:bg-[rgb(124,124,124)]"
            disabled={loading || selectableVisibleIds.length === 0}
          >
            {allVisibleSelected ? "Unselect visible" : "Select visible"}
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-800 hover:bg-[rgb(124,124,124)]"
            disabled={loading || selectedIds.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {!loading && accounts.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">
          App này hiện chưa có account nào.
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">
          Loading accounts...
        </div>
      )}

      {!loading && accounts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(124,124,124)]/70">
              <tr className="text-left">
                <th className="px-3 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={selectableVisibleIds.length === 0}
                  />
                </th>
                <th className="px-3 py-3">Email / Account</th>
                <th className="px-3 py-3">Username</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Note</th>
              </tr>
            </thead>

            <tbody>
              {filteredAccounts.map((item) => {
                const checked = selectedIds.includes(item.id);
                const disabled = item.isActive === false;

                return (
                  <tr
                    key={item.id}
                    className="border-t border-neutral-800 align-top"
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleOne(item.id)}
                      />
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-medium">
                        {item.email || item.name || "-"}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-1">
                        {item.id}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-neutral-300">
                      {item.username || "-"}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          disabled
                            ? "bg-red-950/40 text-red-300 border border-red-900/50"
                            : "bg-emerald-950/40 text-emerald-300 border border-emerald-900/50"
                        }`}
                      >
                        {disabled ? "INACTIVE" : "ACTIVE"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-neutral-400">
                      {item.note || "-"}
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-neutral-400"
                  >
                    No matching accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.length === 0 && !loading && accounts.length > 0 && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-300">
          Chưa chọn account nào. Khi đó user có thể verify pass nhưng sẽ không
          reveal được account.
        </div>
      )}
    </div>
  );
}
