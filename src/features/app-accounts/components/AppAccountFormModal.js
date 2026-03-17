"use client";

/**
 * Modal create/edit cho AppAccount.
 *
 * Một modal dùng chung giúp:
 * - tránh duplicate form giữa create và edit
 * - comment chỉ cần đọc ở một nơi
 * - dễ thêm field mới nếu schema AppAccount thay đổi
 */

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
  createAppAccount,
  updateAppAccount,
} from "../api/appAccounts.api";

const EMPTY_FORM = {
  title: "",
  email: "",
  username: "",
  password: "",
  twoFaKey: "",
  backupCode: "",
  note: "",
  isActive: true,
};

export default function AppAccountFormModal({
  open,
  mode,
  appId,
  account,
  onOpenChange,
  onSaved,
  onToast,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /**
   * Reset form mỗi khi modal mở với mode mới hoặc account mới.
   */
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && account) {
      setForm({
        title: account.title || "",
        email: account.email || "",
        username: account.username || "",
        password: account.password || "",
        twoFaKey: account.twoFaKey || "",
        backupCode: account.backupCode || "",
        note: account.note || "",
        isActive: Boolean(account.isActive),
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");
    setSaving(false);
  }, [open, mode, account]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!appId) {
      setError("Please select an app first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: form.title || null,
        email: form.email || null,
        username: form.username || null,
        password: form.password || null,
        twoFaKey: form.twoFaKey || null,
        backupCode: form.backupCode || null,
        note: form.note || null,
        isActive: Boolean(form.isActive),
      };

      const res =
        mode === "edit" && account?.id
          ? await updateAppAccount(appId, account.id, payload)
          : await createAppAccount(appId, payload);

      if (!res?.success) {
        setError(res?.message || "Failed to save account");
        return;
      }

      onSaved?.(res.item);
      onToast?.(
        "Success",
        mode === "edit"
          ? "App account updated successfully"
          : "App account created successfully",
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
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle>
            {mode === "edit" ? "Edit App Account" : "Create App Account"}
          </DialogTitle>
          <DialogDescription>
            Manage the real account information stored for the selected app.
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
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Account title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="Email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder="Username"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">2FA Key</label>
                <Input
                  value={form.twoFaKey}
                  onChange={(e) => setField("twoFaKey", e.target.value)}
                  placeholder="2FA key"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Code</label>
                <Input
                  value={form.backupCode}
                  onChange={(e) => setField("backupCode", e.target.value)}
                  placeholder="Backup code"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Internal note"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Active account
            </label>

            <DialogFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
