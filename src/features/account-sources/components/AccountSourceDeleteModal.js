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
import { deleteAccountSource } from "../api/accountSources.api";

export default function AccountSourceDeleteModal({
  open,
  source,
  onOpenChange,
  onDeleted,
  onToast,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setError("");
  }, [open, source]);

  if (!source) return null;

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const res = await deleteAccountSource(source.id);

      if (res?.success) {
        onDeleted?.(source.id);
        onToast?.("Thành công", "Đã xóa nguồn API.", false);
        onOpenChange(false);
        return;
      }

      setError(res?.message || "Không thể xóa nguồn API.");
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Xóa nguồn API</DialogTitle>
          <DialogDescription>
            Nguồn sẽ chỉ bị xóa khi chưa có App Account nào đang sử dụng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{source.name}</div>
            <div className="mt-1 break-all text-sm text-slate-600">{source.baseUrl}</div>
            <div className="mt-2 text-sm text-slate-600">
              App Account đang dùng: <span className="font-medium text-slate-900">{source.accountCount || 0}</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
