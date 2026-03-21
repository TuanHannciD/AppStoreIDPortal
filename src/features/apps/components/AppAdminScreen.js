"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { fetchApps } from "../api/apps.api";
import AppDataTable from "./AppDataTable";
import AppDeleteModal from "./AppDeleteModal";
import AppFormModal from "./AppFormModal";
import { getColumns } from "../table/columns";

export default function AppAdminScreen() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    app: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    app: null,
  });

  function showToast(title, message, isInfo = false) {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(title, message, isInfo);
    }
  }

  async function loadApps() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchApps();
      if (!res?.success) {
        setError(res?.message || "Không thể tải danh sách app.");
        setApps([]);
        return;
      }

      setApps(res.apps || []);
    } catch (err) {
      setError(String(err?.message || err));
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  const filteredApps = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return apps;

    return apps.filter((item) =>
      [item.name, item.slug, item.packageType, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [apps, keyword]);

  function upsertApp(item) {
    setApps((prev) => {
      const exists = prev.some((app) => app.id === item.id);
      if (!exists) return [item, ...prev];
      return prev.map((app) => (app.id === item.id ? item : app));
    });
  }

  function removeApp(appId) {
    setApps((prev) => prev.filter((item) => item.id !== appId));
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý app"
          subtitle="Tạo và quản lý thực thể gốc trước khi cấu hình tài khoản hoặc share link."
        />

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Đang tải danh sách app...
          </div>
        ) : (
          <AppDataTable
            columns={getColumns({
              onEdit: (item) =>
                setFormModal({
                  open: true,
                  mode: "edit",
                  app: item,
                }),
              onDelete: (item) =>
                setDeleteModal({
                  open: true,
                  app: item,
                }),
            })}
            data={filteredApps}
            searchValue={keyword}
            onSearchChange={setKeyword}
            onCreate={() =>
              setFormModal({
                open: true,
                mode: "create",
                app: null,
              })
            }
          />
        )}
      </div>

      <AppFormModal
        open={formModal.open}
        mode={formModal.mode}
        app={formModal.app}
        onOpenChange={(nextOpen) =>
          setFormModal((prev) => ({
            ...prev,
            open: nextOpen,
            app: nextOpen ? prev.app : null,
          }))
        }
        onSaved={upsertApp}
        onToast={showToast}
      />

      <AppDeleteModal
        open={deleteModal.open}
        app={deleteModal.app}
        onOpenChange={(nextOpen) =>
          setDeleteModal({
            open: nextOpen,
            app: nextOpen ? deleteModal.app : null,
          })
        }
        onDeleted={removeApp}
        onToast={showToast}
      />
    </>
  );
}
