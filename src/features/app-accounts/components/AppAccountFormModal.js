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
  createAppAccount,
  fetchApiSources,
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
  apiSourceConfigId: "",
  externalKey: "",
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
  const [apiSources, setApiSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

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
        apiSourceConfigId: account.apiSourceConfigId || "",
        externalKey: account.externalKey || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");
    setSaving(false);
  }, [open, mode, account]);

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    async function loadApiSources() {
      setLoadingSources(true);
      try {
        const res = await fetchApiSources();
        if (!ignore) {
          setApiSources(res?.items || []);
        }
      } catch {
        if (!ignore) {
          setApiSources([]);
        }
      } finally {
        if (!ignore) {
          setLoadingSources(false);
        }
      }
    }

    loadApiSources();

    return () => {
      ignore = true;
    };
  }, [open]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!appId) {
      setError("Vui lòng chọn app trước khi tạo tài khoản.");
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
        apiSourceConfigId: form.apiSourceConfigId || null,
        externalKey: form.externalKey || null,
      };

      const res =
        mode === "edit" && account?.id
          ? await updateAppAccount(appId, account.id, payload)
          : await createAppAccount(appId, payload);

      if (!res?.success) {
        setError(res?.message || "Không thể lưu tài khoản.");
        return;
      }

      onSaved?.(res.item);
      onToast?.(
        "Thành công",
        mode === "edit"
          ? "Đã cập nhật tài khoản app."
          : "Đã tạo tài khoản app mới.",
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
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-auto p-0 sm:h-auto sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle>
            {mode === "edit" ? "Chỉnh sửa tài khoản app" : "Tạo tài khoản app"}
          </DialogTitle>
          <DialogDescription>
            Quản lý thông tin tài khoản thật đang được lưu cho app đã chọn.
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
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Ví dụ: Tài khoản chính"
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
                <label className="text-sm font-medium">Tên đăng nhập</label>
                <Input
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder="Tên đăng nhập"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Mật khẩu"
                />
              </div>

              {/* <div className="space-y-2">
                <label className="text-sm font-medium">Khóa 2FA</label>
                <Input
                  value={form.twoFaKey}
                  onChange={(e) => setField("twoFaKey", e.target.value)}
                  placeholder="Khóa 2FA"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mã dự phòng</label>
                <Input
                  value={form.backupCode}
                  onChange={(e) => setField("backupCode", e.target.value)}
                  placeholder="Mã dự phòng"
                />
              </div> */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Nguồn API</label>
                <select
                  value={form.apiSourceConfigId}
                  onChange={(e) =>
                    setField("apiSourceConfigId", e.target.value)
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  disabled={loadingSources}
                >
                  <option value="">
                    {loadingSources
                      ? "Đang tải nguồn API..."
                      : "Không dùng sync API"}
                  </option>
                  {apiSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({source.baseUrl})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">External Key</label>
                <Input
                  value={form.externalKey}
                  onChange={(e) => setField("externalKey", e.target.value)}
                  placeholder="Ví dụ: test6"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Ghi chú</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Ghi chú nội bộ về tài khoản"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Tài khoản đang hoạt động
            </label>

            <DialogFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving
                  ? "Đang lưu..."
                  : mode === "edit"
                    ? "Lưu thay đổi"
                    : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
