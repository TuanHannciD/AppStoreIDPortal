"use client";

/**
 * Modal tạo pass mới.
 *
 * Thiết kế lại theo hướng mobile-first:
 * - modal gần full màn hình trên điện thoại
 * - body cuộn độc lập
 * - action buttons full width để dễ bấm
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createSharePass } from "../../api/sharePage.api";

export default function SharePassCreateModal({
  open,
  sharePageId,
  onOpenChange,
  onCreated,
}) {
  const [form, setForm] = useState({
    pass: "",
    quota: 1,
    label: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setForm({
      pass: "",
      quota: 1,
      label: "",
    });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await createSharePass(sharePageId, {
        pass: form.pass.trim(),
        quota: Number(form.quota),
        label: form.label.trim() || null,
      });

      if (!res?.success) {
        setError(res?.message || "Failed to create pass");
        return;
      }

      resetForm();
      onCreated?.();
      onOpenChange?.(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  function handleClose(nextOpen) {
    if (!nextOpen) resetForm();
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-xl flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle>Add Pass</DialogTitle>
          <DialogDescription>
            Create a new pass with its own quota for this share link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Pass *</label>
              <input
                value={form.pass}
                onChange={(e) => setForm((s) => ({ ...s, pass: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter pass"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Quota *</label>
              <input
                type="number"
                min="1"
                value={form.quota}
                onChange={(e) => setForm((s) => ({ ...s, quota: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Label</label>
              <input
                value={form.label}
                onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Optional label"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "Creating..." : "Create Pass"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
