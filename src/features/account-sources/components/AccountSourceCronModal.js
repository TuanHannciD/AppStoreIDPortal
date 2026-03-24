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
import { Input } from "@/components/ui/input";
import { updateAccountSource } from "../api/accountSources.api";

const EMPTY_FORM = {
  cronEnabled: false,
  cronIntervalHours: "1",
  cronMaxAccountsPerRun: "1",
};

export default function AccountSourceCronModal({
  open,
  source,
  onOpenChange,
  onSaved,
  onToast,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !source) return;
    setForm({
      cronEnabled: Boolean(source.cronEnabled),
      cronIntervalHours: String(source.cronIntervalHours || 1),
      cronMaxAccountsPerRun: String(source.cronMaxAccountsPerRun || 1),
    });
    setSaving(false);
    setError("");
  }, [open, source]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!source?.id) return;

    const intervalHours = Math.max(1, Number(form.cronIntervalHours || 1));
    const maxAccountsPerRun = Math.max(1, Number(form.cronMaxAccountsPerRun || 1));

    setSaving(true);
    setError("");

    try {
      const res = await updateAccountSource(source.id, {
        name: source.name,
        baseUrl: source.baseUrl,
        isActive: source.isActive,
        cronEnabled: Boolean(form.cronEnabled),
        cronIntervalHours: intervalHours,
        cronMaxAccountsPerRun: maxAccountsPerRun,
      });

      if (!res?.success) {
        setError(res?.message || "Không thể cập nhật cron.");
        return;
      }

      onSaved?.(res.item);
      onToast?.("Thành công", "Đã cập nhật cấu hình cron.", false);
      onOpenChange(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cấu hình cron</DialogTitle>
          <DialogDescription>
            Thiết lập chu kỳ chạy tự động cho nguồn API này. Đơn vị nhỏ nhất là giờ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{source?.name}</div>
            <div className="mt-1 break-all text-sm text-slate-600">{source?.baseUrl}</div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.cronEnabled}
              onChange={(e) => setField("cronEnabled", e.target.checked)}
            />
            Bật cron cho nguồn này
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chu kỳ chạy (giờ)</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={form.cronIntervalHours}
                onChange={(e) => setField("cronIntervalHours", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số account tối đa mỗi lượt</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={form.cronMaxAccountsPerRun}
                onChange={(e) => setField("cronMaxAccountsPerRun", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu cấu hình cron"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
