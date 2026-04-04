"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteShareLink } from "../../api/shareLink.api";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export default function ShareLinkDeleteModal({
  open,
  shareLink,
  onOpenChange,
  onDeleted,
  onToast,
}) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setConfirmText("");
    setLoading(false);
    setError("");
  }, [open, shareLink]);

  if (!shareLink) return null;

  const canHardDelete = confirmText.trim() === shareLink.code;

  async function runDelete(force) {
    setLoading(true);
    setError("");

    try {
      const res = await deleteShareLink(shareLink.id, { force, reason });

      if (!res?.success) {
        setError(res?.message || "Không thể xóa share link.");
        return;
      }

      if (force) {
        onDeleted?.(shareLink.id);
      }

      onToast?.(
        "Thành công",
        force
          ? "Đã xóa cứng share link."
          : "Đã xóa mềm share link bằng cách ngừng hiệu lực ngay.",
        false,
      );
      onOpenChange(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,44rem)] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 md:px-6">
          <DialogTitle>Xóa share link</DialogTitle>
          <DialogDescription>
            Xóa mềm sẽ ngừng hiệu lực link ngay lập tức. Xóa cứng sẽ xóa hẳn
            link và toàn bộ pass liên quan.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(85vh-8rem)] space-y-4 overflow-y-auto px-5 py-5 md:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              {shareLink.code}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Ứng dụng:{" "}
              <span className="font-medium text-slate-900">
                {shareLink.appName || shareLink.appLabel || "-"}
              </span>
            </div>
          </div>

          {shareLink.passCount != null ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                Dữ liệu hiện có
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <SummaryRow label="Số pass" value={shareLink.passCount} />
                <SummaryRow
                  label="Trạng thái"
                  value={shareLink.expiresAt ? "Có ngày hết hạn" : "Đang hoạt động"}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do thao tác</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Ghi chú để lưu log quản trị"
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm font-semibold text-rose-900">
              Xác nhận xóa cứng
            </div>
            <p className="text-sm text-rose-800">
              Để xóa hẳn, hãy nhập chính xác mã{" "}
              <span className="font-semibold">{shareLink.code}</span>.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              placeholder={`Nhập ${shareLink.code}`}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t px-5 py-4 md:flex-row md:justify-end md:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => runDelete(false)}
          >
            {loading ? "Đang xử lý..." : "Xóa mềm"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading || !canHardDelete}
            onClick={() => runDelete(true)}
          >
            {loading ? "Đang xóa..." : "Xóa cứng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
