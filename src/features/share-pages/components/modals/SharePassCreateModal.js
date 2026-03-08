"use client";

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Pass</DialogTitle>
          <DialogDescription>
            Create a new pass with its own quota for this share link.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Pass *</label>
            <input
              value={form.pass}
              onChange={(e) => setForm((s) => ({ ...s, pass: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Enter pass"
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Quota *</label>
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
            <label className="text-sm text-muted-foreground mb-1 block">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Optional label"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Pass"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}