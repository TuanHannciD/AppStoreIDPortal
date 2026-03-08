"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchSharePageDetail, updateSharePage } from "../../api/sharePage.api";
import { mapSharePageDetail } from "../../lib/sharePage.detail.mapper";

function toDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SharePageEditModal({
  open,
  sharePageId,
  onOpenChange,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({
    note: "",
    expiresAt: "",
  });

  useEffect(() => {
    if (!open || !sharePageId) return;

    (async () => {
      setLoading(true);
      setError("");
      setDetail(null);

      try {
        const res = await fetchSharePageDetail(sharePageId);
        if (!res?.success) {
          setError(res?.message || "Failed to load detail");
          return;
        }

        const mapped = mapSharePageDetail(res.item);
        setDetail(mapped);
        setForm({
          note: mapped.note || "",
          expiresAt: toDateTimeLocal(mapped.expiresAt),
        });
      } catch (err) {
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, sharePageId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await updateSharePage(sharePageId, {
        note: form.note.trim() || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });

      if (!res?.success) {
        setError(res?.message || "Failed to save");
        return;
      }

      onSaved?.();
      onOpenChange?.(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Share Link</DialogTitle>
          <DialogDescription>
            Update editable metadata for the selected share link.
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="py-8 text-sm text-muted-foreground">Loading...</div>}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && detail && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Code</div>
                <div className="font-mono">{detail.code}</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">App</div>
                <div>{detail.app.name}</div>
              </div>

              <div className="md:col-span-2">
                <label className="text-muted-foreground mb-1 block">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block">Expires At</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}