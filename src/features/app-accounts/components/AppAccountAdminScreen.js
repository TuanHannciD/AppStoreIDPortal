"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  deleteAppAccount,
  fetchAppAccountsByApp,
  fetchAppsForAccounts,
  updateAppAccount,
} from "../api/appAccounts.api";
import AppAccountDataTable from "./AppAccountDataTable";
import AppAccountFormModal from "./AppAccountFormModal";
import AppAccountDeleteModal from "./AppAccountDeleteModal";
import { getColumns } from "../table/columns";

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
  const [deleteModal, setDeleteModal] = useState({
    open: false,
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
        setError(res?.message || "Không thể tải danh sách tài khoản app.");
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
      const haystack = [item.title, item.email, item.username, item.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [accounts, keyword]);

  const selectedApp = useMemo(
    () => apps.find((item) => item.id === selectedAppId) || null,
    [apps, selectedAppId],
  );

  function upsertLocalAccount(item) {
    setAccounts((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (!exists) return [item, ...prev];
      return prev.map((x) => (x.id === item.id ? item : x));
    });
  }

  function removeLocalAccount(accountId) {
    setAccounts((prev) => prev.filter((x) => x.id !== accountId));
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
      showToast("Lỗi", res?.message || "Không thể cập nhật tài khoản.", true);
      return;
    }

    upsertLocalAccount(res.item);
    showToast("Thành công", "Đã cập nhật trạng thái tài khoản.", false);
  }

  async function handleDelete(item) {
    setDeleteModal({
      open: true,
      account: item,
    });
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý tài khoản app"
          subtitle="Tạo và quản lý các tài khoản thật được lưu trực tiếp dưới từng app."
        />

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loadingAccounts ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Đang tải danh sách tài khoản app...
          </div>
        ) : (
          <AppAccountDataTable
            columns={getColumns({
              onEdit: (item) =>
                setModal({
                  open: true,
                  mode: "edit",
                  account: item,
                }),
              onToggleActive: handleToggleActive,
              onDelete: handleDelete,
            })}
            data={filteredAccounts}
            apps={apps}
            loadingApps={loadingApps}
            selectedAppId={selectedAppId}
            onSelectedAppIdChange={setSelectedAppId}
            searchValue={keyword}
            onSearchChange={setKeyword}
            onCreate={() =>
              setModal({
                open: true,
                mode: "create",
                account: null,
              })
            }
            emptyMessage={
              selectedAppId
                ? "Chưa có tài khoản nào cho app đã chọn."
                : "Hãy chọn app để bắt đầu quản lý tài khoản."
            }
          />
        )}
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

      <AppAccountDeleteModal
        open={deleteModal.open}
        app={selectedApp}
        account={deleteModal.account}
        onOpenChange={(nextOpen) =>
          setDeleteModal((prev) => ({
            ...prev,
            open: nextOpen,
            account: nextOpen ? prev.account : null,
          }))
        }
        onDeleted={removeLocalAccount}
        onToast={showToast}
      />
    </>
  );
}
