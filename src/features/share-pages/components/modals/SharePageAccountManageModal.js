"use client";

/**
 * Modal này quản lý account của một share page.
 *
 * Mục tiêu:
 * - xem account đang gắn với share page
 * - bật/tắt account trong share page
 * - đổi thứ tự reveal bằng move up/down
 * - gỡ account khỏi share page
 * - thêm account mới từ pool account của app
 *
 * Đây là modal mobile-first:
 * - gần full màn hình trên điện thoại
 * - phần body cuộn độc lập
 * - action buttons dùng kích thước dễ bấm
 *
 * Comment trong file này cố tình chi tiết để bạn đọc flow account
 * mà không cần nhảy qua nhiều file cùng lúc.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fetchSharePageAccounts,
  updateSharePageAccount,
} from "../../api/sharePage.api";

function accountLabel(item) {
  return item?.email || item?.username || item?.title || item?.id || "-";
}

function AccountActionButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

export default function SharePageAccountManageModal({
  open,
  sharePageId,
  onOpenChange,
  onToast,
}) {
  /**
   * `loading`
   * Báo modal đang gọi API để tải dữ liệu ban đầu.
   */
  const [loading, setLoading] = useState(false);

  /**
   * `savingAccountId`
   * Ghi nhớ account nào đang chạy action để disable đúng row đó.
   */
  const [savingAccountId, setSavingAccountId] = useState("");

  /**
   * `error`
   * Hiển thị lỗi khi fetch hoặc mutate thất bại.
   */
  const [error, setError] = useState("");

  /**
   * `payload`
   * Chứa toàn bộ dữ liệu modal cần dùng:
   * - sharePage
   * - assignedAccounts
   * - availableAccounts
   */
  const [payload, setPayload] = useState(null);

  /**
   * `keyword`
   * Tìm kiếm nhanh trong danh sách available accounts để add vào share page.
   */
  const [keyword, setKeyword] = useState("");

  async function loadData() {
    if (!sharePageId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchSharePageAccounts(sharePageId);

      if (!res?.success) {
        setError(res?.message || "Failed to load accounts");
        setPayload(null);
        return;
      }

      setPayload(res);
    } catch (err) {
      setError(String(err?.message || err));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !sharePageId) return;
    loadData();
  }, [open, sharePageId]);

  const assignedIds = useMemo(() => {
    return new Set((payload?.assignedAccounts || []).map((item) => item.appAccountId));
  }, [payload]);

  /**
   * Chỉ hiển thị account chưa được gắn vào share page ở khối "Add Account".
   */
  const availableToAdd = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return (payload?.availableAccounts || []).filter((item) => {
      if (assignedIds.has(item.id)) return false;

      if (!q) return true;

      const haystack = [item.email, item.username, item.title, item.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [payload, assignedIds, keyword]);

  async function runAction(appAccountId, action) {
    setSavingAccountId(appAccountId);
    setError("");

    try {
      const res = await updateSharePageAccount(sharePageId, {
        appAccountId,
        action,
      });

      if (!res?.success) {
        setError(res?.message || "Failed to update account");
        return;
      }

      setPayload(res);
      onToast?.("Success", res.message || "Account updated", false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSavingAccountId("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden p-0 sm:h-[90vh] sm:w-[95vw]">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle>Manage Accounts</DialogTitle>
          <DialogDescription>
            Control which accounts can be revealed for this share page and in what order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">
              Loading accounts...
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && payload ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Share Page
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 sm:grid-cols-[110px_1fr]">
                    <div className="text-muted-foreground">Code</div>
                    <div className="break-all font-mono">{payload.sharePage?.code}</div>

                    <div className="text-muted-foreground">App</div>
                    <div>{payload.sharePage?.app?.name || "-"}</div>

                    <div className="text-muted-foreground">Slug</div>
                    <div className="break-all">{payload.sharePage?.app?.slug || "-"}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <div className="text-muted-foreground">Assigned</div>
                    <div>{payload.assignedAccounts?.length || 0}</div>

                    <div className="text-muted-foreground">Available</div>
                    <div>{payload.availableAccounts?.length || 0}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold">Assigned Accounts</div>
                  <div className="text-xs text-muted-foreground">
                    Accounts ở trên cùng sẽ được ưu tiên reveal trước theo `sortOrder`.
                  </div>
                </div>

                <div className="space-y-3">
                  {(payload.assignedAccounts || []).length ? (
                    payload.assignedAccounts.map((item, index, list) => {
                      const busy = savingAccountId === item.appAccountId;
                      const appAccount = item.account;

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium">
                                  {accountLabel(appAccount)}
                                </div>
                                <span className="rounded-full border px-2 py-0.5 text-[11px]">
                                  Order {index + 1}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                    item.isActive
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-rose-200 bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {item.isActive ? "LINK ACTIVE" : "LINK INACTIVE"}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                    appAccount?.isActive
                                      ? "border-slate-200 bg-slate-50 text-slate-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {appAccount?.isActive ? "APP ACTIVE" : "APP INACTIVE"}
                                </span>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Username: {appAccount?.username || "-"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Title: {appAccount?.title || "-"}
                              </div>
                              <div className="text-sm text-muted-foreground break-words">
                                Note: {appAccount?.note || "-"}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <AccountActionButton
                                onClick={() => runAction(item.appAccountId, "MOVE_UP")}
                                disabled={busy || index === 0}
                              >
                                Up
                              </AccountActionButton>
                              <AccountActionButton
                                onClick={() => runAction(item.appAccountId, "MOVE_DOWN")}
                                disabled={busy || index === list.length - 1}
                              >
                                Down
                              </AccountActionButton>
                              <AccountActionButton
                                onClick={() =>
                                  runAction(item.appAccountId, "TOGGLE_ACTIVE")
                                }
                                disabled={busy}
                              >
                                {item.isActive ? "Disable" : "Enable"}
                              </AccountActionButton>
                              <AccountActionButton
                                onClick={() => runAction(item.appAccountId, "REMOVE")}
                                disabled={busy}
                              >
                                Remove
                              </AccountActionButton>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No account is assigned to this share page yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold">Add Accounts</div>
                  <div className="text-xs text-muted-foreground">
                    Add more accounts from the current app into this share page pool.
                  </div>
                </div>

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search email, username, title, note..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />

                <div className="space-y-3">
                  {availableToAdd.length ? (
                    availableToAdd.map((item) => {
                      const busy = savingAccountId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">{accountLabel(item)}</div>
                              <div className="text-sm text-muted-foreground">
                                Username: {item.username || "-"}
                              </div>
                              <div className="text-sm text-muted-foreground break-words">
                                Note: {item.note || "-"}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => runAction(item.id, "ADD")}
                              disabled={busy}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No more accounts available to add.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
