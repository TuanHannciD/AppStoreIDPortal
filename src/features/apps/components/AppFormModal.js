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
import { createApp, updateApp } from "../api/apps.api";

const EMPTY_FORM = {
  name: "",
  slug: "",
  packageType: "",
  description: "",
};

export default function AppFormModal({
  open,
  mode,
  app,
  onOpenChange,
  onSaved,
  onToast,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && app) {
      setForm({
        name: app.name || "",
        slug: app.slug || "",
        packageType: app.packageType || "",
        description: app.description || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setSaving(false);
    setError("");
  }, [open, mode, app]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      packageType: form.packageType,
      description: form.description || null,
    };

    try {
      const res =
        mode === "edit" && app?.id
          ? await updateApp(app.id, payload)
          : await createApp(payload);

      if (!res?.success) {
        setError(res?.message || "Không thể lưu app.");
        return;
      }

      onSaved?.(res.item);
      onToast?.(
        "Thành công",
        mode === "edit"
          ? "Đã cập nhật thông tin app."
          : "Đã tạo app mới.",
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
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle>
            {mode === "edit" ? "Chỉnh sửa app" : "Tạo app mới"}
          </DialogTitle>
          <DialogDescription>
            Quản lý thực thể gốc của hệ thống trước khi tạo tài khoản hoặc share link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Tên app</label>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ví dụ: Netflix Premium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="vi-du-netflix-premium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Loại gói</label>
                <Input
                  value={form.packageType}
                  onChange={(e) => setField("packageType", e.target.value)}
                  placeholder="Ví dụ: Premium"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Ghi chú ngắn về app hoặc phạm vi sử dụng"
                />
              </div>
            </div>

            <DialogFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving
                  ? "Đang lưu..."
                  : mode === "edit"
                    ? "Lưu thay đổi"
                    : "Tạo app"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
