"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchShareLinkDetail, updateShareLink } from "../../api/shareLink.api";
import { mapShareLinkDetail } from "../../lib/shareLink.detail.mapper";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (input) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ShareLinkEditModal({
  open,
  shareLinkId,
  onOpenChange,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({
    apiUrl: "",
    note: "",
    expiresAt: "",
  });

  useEffect(() => {
    if (!open || !shareLinkId) return;

    (async () => {
      setLoading(true);
      setError("");
      setDetail(null);

      try {
        const res = await fetchShareLinkDetail(shareLinkId);
        if (!res?.success) {
          setError(res?.message || "Không thể tải chi tiết share link.");
          return;
        }

        const mapped = mapShareLinkDetail(res.item);
        setDetail(mapped);
        setForm({
          apiUrl: mapped.apiUrl || "",
          note: mapped.note || "",
          expiresAt: toDateTimeLocal(mapped.expiresAt),
        });
      } catch (err) {
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, shareLinkId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await updateShareLink(shareLinkId, {
        apiUrl: form.apiUrl.trim() || null,
        note: form.note.trim() || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });

      if (!res?.success) {
        setError(res?.message || "Không thể lưu thay đổi.");
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
      <DialogContent className="w-[min(96vw,52rem)] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 md:px-6">
          <DialogTitle>Chỉnh sửa share link</DialogTitle>
          <DialogDescription>
            Cập nhật các thông tin có thể chỉnh sửa của share link đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(88vh-7rem)] overflow-y-auto px-5 py-5 md:px-6">
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {!loading && detail ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm md:grid-cols-2">
                <div>
                  <div className="mb-1 text-muted-foreground">Mã link</div>
                  <div className="font-mono">{detail.code}</div>
                </div>

                <div>
                  <div className="mb-1 text-muted-foreground">Ứng dụng</div>
                  <div>{detail.app.name}</div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-muted-foreground">Link API</label>
                  <input
                    type="url"
                    value={form.apiUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, apiUrl: event.target.value }))
                    }
                    placeholder="https://example.com/api/share-link"
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-muted-foreground">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, note: event.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-muted-foreground">Ngày hết hạn</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                    }
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange?.(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
