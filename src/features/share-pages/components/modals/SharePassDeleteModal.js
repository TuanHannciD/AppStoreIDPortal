"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteSharePass } from "../../api/sharePage.api";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export default function SharePassDeleteModal({
  open,
  sharePageId,
  sharePageCode,
  pass,
  onOpenChange,
  onDeleted,
  onToast,
}) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dependencySummary, setDependencySummary] = useState(null);
  const [mode, setMode] = useState("SAFE_DELETE");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setConfirmText("");
    setLoading(false);
    setError("");
    setDependencySummary(null);
    setMode("SAFE_DELETE");
  }, [open, pass]);

  const confirmValue = useMemo(
    () => (pass?.label?.trim() ? pass.label.trim() : pass?.id || ""),
    [pass],
  );

  if (!pass) return null;

  const canForceDelete = confirmText.trim() === confirmValue;

  async function runDelete(force) {
    setLoading(true);
    setError("");

    try {
      const res = await deleteSharePass(sharePageId, pass.id, { force, reason });

      if (res?.success) {
        onDeleted?.(pass.id);
        onToast?.(
          "Thành công",
          force
            ? "Đã xóa sâu pass và các dữ liệu phụ thuộc."
            : "Đã xóa pass thành công.",
          false,
        );
        onOpenChange(false);
        return;
      }

      if (res?.blocked) {
        setMode("FORCE_DELETE");
        setDependencySummary(res.dependencySummary);
        setError(
          "Pass vẫn còn dữ liệu phụ thuộc. Bạn chỉ có thể tiếp tục bằng chế độ xóa sâu.",
        );
        return;
      }

      setDependencySummary(res?.dependencySummary || null);
      setError(res?.message || "Không thể xóa pass.");
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xóa pass</DialogTitle>
          <DialogDescription>
            {mode === "SAFE_DELETE"
              ? "Chế độ xóa thường chỉ thành công khi pass không còn dữ liệu phụ thuộc."
              : "Chế độ xóa sâu sẽ xóa pass cùng toàn bộ dữ liệu phụ thuộc liên quan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              {pass.label || "Pass không nhãn"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Mã share page:{" "}
              <span className="font-medium text-slate-900">
                {sharePageCode || "-"}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Mã pass:{" "}
              <span className="font-mono text-slate-900">{pass.id}</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {dependencySummary ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">
                Các dữ liệu sẽ bị ảnh hưởng nếu xóa sâu
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <SummaryRow
                  label="Mã xác minh"
                  value={dependencySummary.sharePassVerifications || 0}
                />
                <SummaryRow
                  label="Lịch sử xác thực"
                  value={dependencySummary.shareAuthLogs || 0}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do xóa</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Ghi chú lý do xóa để lưu vào log"
            />
          </div>

          {mode === "FORCE_DELETE" ? (
            <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm font-semibold text-rose-900">
                Xác nhận xóa sâu
              </div>
              <p className="text-sm text-rose-800">
                Để tiếp tục, hãy nhập chính xác{" "}
                <span className="font-semibold">{confirmValue}</span>.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder={`Nhập ${confirmValue}`}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>

          {mode === "SAFE_DELETE" ? (
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => runDelete(false)}
            >
              {loading ? "Đang kiểm tra..." : "Xóa thường"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={loading || !canForceDelete}
              onClick={() => runDelete(true)}
            >
              {loading ? "Đang xóa..." : "Xóa sâu"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
