"use client";

/**
 * Modal dùng chung cho các hành động trên một pass.
 *
 * Bản mobile-first này dùng:
 * - header cố định ở trên
 * - vùng nội dung cuộn độc lập
 * - footer action full-width trên màn nhỏ
 */

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
import { Input } from "@/components/ui/input";
import { updateSharePass } from "../../api/sharePage.api";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getStatusTone(status) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "REVOKED") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "EXPIRED") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "EXHAUSTED") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function SharePassActionModal({
  open,
  sharePageId,
  mode,
  pass,
  onOpenChange,
  onUpdated,
  onToast,
}) {
  const [editForm, setEditForm] = useState({
    label: "",
    quotaTotal: "1",
    expiresAt: "",
  });
  const [quotaUsed, setQuotaUsed] = useState("0");
  const [reason, setReason] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rotatedPass, setRotatedPass] = useState("");

  useEffect(() => {
    if (!open || !pass) return;

    setEditForm({
      label: pass.label || "",
      quotaTotal: String(pass.quotaTotal ?? 1),
      expiresAt: pass.expiresAt
        ? new Date(pass.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setQuotaUsed(String(pass.quotaUsed ?? 0));
    setReason(pass.reason || "");
    setNewPass("");
    setRotatedPass("");
    setSaving(false);
    setError("");
  }, [open, pass, mode]);

  const content = useMemo(() => {
    if (mode === "view") {
      return {
        title: "Pass Details",
        description: "View status, quota and usage history for this pass.",
        confirmLabel: "",
      };
    }

    if (mode === "edit") {
      return {
        title: "Edit Pass",
        description: "Update pass metadata without changing the current password.",
        confirmLabel: "Save Changes",
      };
    }

    if (mode === "resetUsage") {
      return {
        title: "Reset Usage",
        description: "Adjust quotaUsed to reopen usage or sync data.",
        confirmLabel: "Save Usage",
      };
    }

    if (mode === "rotate") {
      return {
        title: "Rotate Pass",
        description: "Replace the current pass and show the plaintext once after saving.",
        confirmLabel: "Rotate Pass",
      };
    }

    if (mode === "revoke") {
      return {
        title: "Revoke Pass",
        description: "Block this pass immediately for both verify and reveal flows.",
        confirmLabel: "Revoke Pass",
      };
    }

    if (mode === "restore") {
      return {
        title: "Restore Pass",
        description: "Remove the revoked state while keeping quota and expiry rules.",
        confirmLabel: "Restore Pass",
      };
    }

    return {
      title: "Pass Action",
      description: "",
      confirmLabel: "Save",
    };
  }, [mode]);

  if (!pass) return null;

  async function handleSubmit() {
    if (mode === "view") {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    setError("");

    try {
      let payload;

      if (mode === "edit") {
        const parsedQuotaTotal = Number(editForm.quotaTotal);

        if (!Number.isInteger(parsedQuotaTotal) || parsedQuotaTotal < 1) {
          setError("Quota total must be an integer greater than 0");
          setSaving(false);
          return;
        }

        payload = {
          action: "EDIT",
          label: editForm.label.trim() || null,
          quotaTotal: parsedQuotaTotal,
          expiresAt: editForm.expiresAt
            ? new Date(editForm.expiresAt).toISOString()
            : null,
        };
      } else if (mode === "resetUsage") {
        const parsedQuotaUsed = Number(quotaUsed);

        if (!Number.isInteger(parsedQuotaUsed) || parsedQuotaUsed < 0) {
          setError("Quota used must be a non-negative integer");
          setSaving(false);
          return;
        }

        payload = {
          action: "RESET_USAGE",
          quotaUsed: parsedQuotaUsed,
        };
      } else if (mode === "revoke") {
        payload = {
          action: "REVOKE",
          reason: reason.trim() || "ADMIN_REVOKED",
        };
      } else if (mode === "rotate") {
        payload = {
          action: "ROTATE",
          newPass: newPass.trim(),
        };

        if (!payload.newPass) {
          setError("New pass is required");
          setSaving(false);
          return;
        }
      } else {
        payload = {
          action: "RESTORE",
        };
      }

      const res = await updateSharePass(sharePageId, pass.id, payload);

      if (!res?.success) {
        setError(res?.message || "Failed to update pass");
        return;
      }

      onUpdated?.(res.item);
      if (mode === "rotate" && res?.rotatedPass) {
        setRotatedPass(res.rotatedPass);
      }
      onToast?.("Success", res.message || "Pass updated successfully", false);

      if (mode !== "rotate") {
        onOpenChange(false);
      }
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
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Label</div>
                <div className="mt-1 font-medium">{pass.label || "-"}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                <div
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(pass.status)}`}
                >
                  {pass.status}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Quota</div>
                <div className="mt-1 font-medium">
                  {pass.quotaUsed} / {pass.quotaTotal} used
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</div>
                <div className="mt-1 font-medium">{pass.quotaRemaining}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Expires At</div>
                <div className="mt-1">{fmtDate(pass.expiresAt)}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Revoked At</div>
                <div className="mt-1">{fmtDate(pass.revokedAt)}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Last Verified</div>
                <div className="mt-1">{fmtDate(pass.lastVerifiedAt)}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Last Revealed</div>
                <div className="mt-1">{fmtDate(pass.lastRevealedAt)}</div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Reason</div>
                <div className="mt-1 break-words">{pass.reason || "-"}</div>
              </div>
            </div>

            {mode === "resetUsage" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  quotaUsed
                </label>
                <Input
                  type="number"
                  min="0"
                  max={String(pass.quotaTotal ?? 0)}
                  value={quotaUsed}
                  onChange={(e) => setQuotaUsed(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  Server will clamp values above quotaTotal to keep data safe.
                </div>
              </div>
            ) : null}

            {mode === "edit" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Label</label>
                    <Input
                      value={editForm.label}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      placeholder="Optional label"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quota Total</label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.quotaTotal}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          quotaTotal: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Expires At</label>
                    <Input
                      type="datetime-local"
                      value={editForm.expiresAt}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          expiresAt: e.target.value,
                        }))
                      }
                    />
                    <div className="text-xs text-muted-foreground">
                      Leave empty if this pass should not have its own expiry.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "revoke" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Revoke reason
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ADMIN_REVOKED"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground">
                  This reason may be returned by the public API when access is blocked.
                </div>
              </div>
            ) : null}

            {mode === "rotate" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    New pass
                  </label>
                  <Input
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new pass"
                    maxLength={128}
                  />
                  <div className="text-xs text-muted-foreground">
                    Rotate changes only the access password. Label, quota and expiry stay the same.
                  </div>
                </div>

                {rotatedPass ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <div className="font-semibold">New pass created</div>
                    <div className="mt-2 break-all rounded-md bg-white/70 p-2 font-mono text-xs sm:text-sm">
                      {rotatedPass}
                    </div>
                    <div className="mt-2 text-xs">
                      This is the only plaintext display after rotate. Save it if needed.
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </Button>

          {mode !== "view" ? (
            <Button
              type="button"
              variant={mode === "revoke" ? "destructive" : "default"}
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving..." : content.confirmLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
