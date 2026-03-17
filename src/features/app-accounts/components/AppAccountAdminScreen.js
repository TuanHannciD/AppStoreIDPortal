"use client";

/**
 * Màn hình CRUD riêng cho AppAccount.
 *
 * Flow chính:
 * 1. admin chọn app
 * 2. load danh sách AppAccount của app đó
 * 3. create / edit / delete / toggle active
 *
 * Đây là module "nguồn dữ liệu account thật",
 * khác với màn `Manage Accounts` trong share page vốn chỉ quản lý việc gắn account vào share page.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import {
  deleteAppAccount,
  fetchAppAccountsByApp,
  fetchAppsForAccounts,
  updateAppAccount,
} from "../api/appAccounts.api";
import AppAccountFormModal from "./AppAccountFormModal";

function accountDisplay(item) {
  return item.email || item.username || item.title || item.id;
}

export default function AppAccountAdminScreen() {
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    account: null,
  });

  function showToast(title, message, isInfo = false) {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(title, message, isInfo);
    }
  }

  async function loadApps() {
    setLoadingApps(true);

    try {
      const res = await fetchAppsForAccounts();
      setApps(res?.apps || []);

      if (!selectedAppId && res?.apps?.[0]?.id) {
        setSelectedAppId(res.apps[0].id);
      }
    } finally {
      setLoadingApps(false);
    }
  }

  async function loadAccounts(appId) {
    if (!appId) {
      setAccounts([]);
      return;
    }

    setLoadingAccounts(true);
    setError("");

    try {
      const res = await fetchAppAccountsByApp(appId);

      if (!res?.success) {
        setError(res?.message || "Failed to load app accounts");
        setAccounts([]);
        return;
      }

      setAccounts(res.accounts || []);
    } catch (err) {
      setError(String(err?.message || err));
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (!selectedAppId) return;
    loadAccounts(selectedAppId);
  }, [selectedAppId]);

  const filteredAccounts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return accounts;

    return accounts.filter((item) => {
      const haystack = [
        item.title,
        item.email,
        item.username,
        item.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [accounts, keyword]);

  function upsertLocalAccount(item) {
    setAccounts((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (!exists) return [item, ...prev];
      return prev.map((x) => (x.id === item.id ? item : x));
    });
  }

  async function handleToggleActive(item) {
    const res = await updateAppAccount(selectedAppId, item.id, {
      title: item.title,
      email: item.email,
      username: item.username,
      password: item.password,
      twoFaKey: item.twoFaKey,
      backupCode: item.backupCode,
      note: item.note,
      isActive: !item.isActive,
    });

    if (!res?.success) {
      showToast("Error", res?.message || "Failed to update account", true);
      return;
    }

    upsertLocalAccount(res.item);
    showToast("Success", "Account status updated", false);
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete account "${accountDisplay(item)}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    const res = await deleteAppAccount(selectedAppId, item.id);

    if (!res?.success) {
      showToast("Error", res?.message || "Failed to delete account", true);
      return;
    }

    setAccounts((prev) => prev.filter((x) => x.id !== item.id));
    showToast("Success", "Account deleted successfully", false);
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="App Accounts"
          subtitle="Create and manage the real account records stored under each app."
          actions={
            <Button
              type="button"
              onClick={() =>
                setModal({
                  open: true,
                  mode: "create",
                  account: null,
                })
              }
              disabled={!selectedAppId}
            >
              Create Account
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium">App</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={loadingApps}
            >
              <option value="">
                {loadingApps ? "Loading apps..." : "Select an app"}
              </option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search title, email, username, note..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loadingAccounts ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Loading app accounts...
          </div>
        ) : null}

        {!loadingAccounts ? (
          <div className="space-y-3">
            {filteredAccounts.length ? (
              filteredAccounts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{accountDisplay(item)}</div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            item.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Title: {item.title || "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Username: {item.username || "-"}
                      </div>
                      <div className="text-sm text-muted-foreground break-words">
                        Note: {item.note || "-"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setModal({
                            open: true,
                            mode: "edit",
                            account: item,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {selectedAppId
                  ? "No app accounts found for the selected app."
                  : "Select an app to start managing accounts."}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <AppAccountFormModal
        open={modal.open}
        mode={modal.mode}
        appId={selectedAppId}
        account={modal.account}
        onOpenChange={(nextOpen) =>
          setModal((prev) => ({
            ...prev,
            open: nextOpen,
            account: nextOpen ? prev.account : null,
          }))
        }
        onSaved={upsertLocalAccount}
        onToast={showToast}
      />
    </>
  );
}
