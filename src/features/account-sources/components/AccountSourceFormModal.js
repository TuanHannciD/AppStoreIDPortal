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
import {
  createAccountSource,
  updateAccountSource,
} from "../api/accountSources.api";

const EMPTY_FORM = {
  name: "",
  baseUrl: "",
  isActive: true,
};

export default function AccountSourceFormModal({
  open,
  mode,
  source,
  onOpenChange,
  onSaved,
  onToast,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && source) {
      setForm({
        name: source.name || "",
        baseUrl: source.baseUrl || "",
        isActive: Boolean(source.isActive),
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setSaving(false);
    setError("");
  }, [open, mode, source]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      baseUrl: form.baseUrl,
      isActive: Boolean(form.isActive),
    };

    try {
      const res =
        mode === "edit" && source?.id
          ? await updateAccountSource(source.id, payload)
          : await createAccountSource(payload);

      if (!res?.success) {
        setError(res?.message || "Không thể lưu nguồn API.");
        return;
      }

      onSaved?.(res.item);
      onToast?.(
        "Thành công",
        mode === "edit"
          ? "Đã cập nhật nguồn API."
          : "Đã tạo nguồn API mới.",
        false,
      );
      onOpenChange(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Chỉnh sửa nguồn API" : "Tạo nguồn API mới"}
          </DialogTitle>
          <DialogDescription>
            Quản lý các endpoint gốc dùng để đồng bộ App Account từ hệ thống bên ngoài.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Tên nguồn API</label>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ví dụ: ApplePro"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input
              value={form.baseUrl}
              onChange={(e) => setField("baseUrl", e.target.value)}
              placeholder="https://applepro.yuichycsa.id.vn/shareapi"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            Nguồn đang hoạt động
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo nguồn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
