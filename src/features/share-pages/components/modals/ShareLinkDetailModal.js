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
import { fetchShareLinkDetail } from "../../api/shareLink.api";
import { mapShareLinkDetail } from "../../lib/shareLink.detail.mapper";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function ShareLinkDetailModal({
  open,
  shareLinkId,
  onOpenChange,
  onManagePasses,
  onEdit,
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !shareLinkId) return;

    (async () => {
      setLoading(true);
      setError("");
      setDetail(null);

      try {
        const res = await fetchShareLinkDetail(shareLinkId);
        if (!res?.success) {
          setError(res?.message || "Failed to load detail");
          return;
        }
        setDetail(mapShareLinkDetail(res.item));
      } catch (err) {
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, shareLinkId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,64rem)] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 md:px-6">
          <DialogTitle>Share Link Detail</DialogTitle>
          <DialogDescription>
            Inspect the selected share link and its metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(88vh-7rem)] overflow-y-auto px-5 py-5 md:px-6">
          {loading && (
            <div className="py-10 text-sm text-muted-foreground">Loading...</div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="text-sm font-semibold">Overview</div>

                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <div className="text-muted-foreground">Code</div>
                  <div className="font-mono">{detail.code}</div>

                  <div className="text-muted-foreground">App</div>
                  <div>{detail.app.name}</div>

                  <div className="text-muted-foreground">App Slug</div>
                  <div>{detail.app.slug}</div>

                  <div className="text-muted-foreground">Package Type</div>
                  <div>{detail.app.packageType}</div>

                  <div className="text-muted-foreground">Expires At</div>
                  <div>{fmtDate(detail.expiresAt)}</div>

                  <div className="text-muted-foreground">Created At</div>
                  <div>{fmtDate(detail.createdAt)}</div>

                  <div className="text-muted-foreground">Updated At</div>
                  <div>{fmtDate(detail.updatedAt)}</div>

                  <div className="text-muted-foreground">Pass Count</div>
                  <div>{detail.passCount}</div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="text-sm font-semibold">Additional Info</div>

                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <div className="text-muted-foreground">Public URL</div>
                  <div className="font-mono break-all">/{detail.code}</div>

                  <div className="text-muted-foreground">Description</div>
                  <div>{detail.app.description || "-"}</div>

                  <div className="text-muted-foreground">Note</div>
                  <div className="whitespace-pre-wrap">
                    {detail.note || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onEdit?.(detail)}>
                Edit
              </Button>
              <Button onClick={() => onManagePasses?.(detail)}>
                Manage Passes
              </Button>
            </div>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
