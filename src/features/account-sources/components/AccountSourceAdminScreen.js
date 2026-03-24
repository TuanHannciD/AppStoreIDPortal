"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  fetchAccountSources,
  runAccountSourceNow,
  updateAccountSource,
} from "../api/accountSources.api";
import AccountSourceDataTable from "./AccountSourceDataTable";
import AccountSourceFormModal from "./AccountSourceFormModal";
import AccountSourceDeleteModal from "./AccountSourceDeleteModal";
import AccountSourceCronModal from "./AccountSourceCronModal";
import { getColumns } from "../table/columns";

export default function AccountSourceAdminScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [, setTick] = useState(Date.now());
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    source: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    source: null,
  });
  const [cronModal, setCronModal] = useState({
    open: false,
    source: null,
  });

  function showToast(title, message, isInfo = false) {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(title, message, isInfo);
    }
  }

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchAccountSources();
      if (!res?.success) {
        setError(res?.message || "Không thể tải danh sách nguồn API.");
        setItems([]);
        return;
      }

      setItems(res.items || []);
    } catch (err) {
      setError(String(err?.message || err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredItems = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.baseUrl, item.lastCronSummary, item.lastCronError]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [items, keyword]);

  function upsertItem(item) {
    setItems((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (!exists) return [item, ...prev];
      return prev.map((x) => (x.id === item.id ? item : x));
    });
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function handleToggleActive(item) {
    const res = await updateAccountSource(item.id, {
      name: item.name,
      baseUrl: item.baseUrl,
      isActive: !item.isActive,
      cronEnabled: item.cronEnabled,
      cronIntervalHours: item.cronIntervalHours,
      cronMaxAccountsPerRun: item.cronMaxAccountsPerRun,
    });

    if (!res?.success) {
      showToast("Lỗi", res?.message || "Không thể cập nhật nguồn API.", true);
      return;
    }

    upsertItem(res.item);
    showToast("Thành công", "Đã cập nhật trạng thái nguồn API.", false);
  }

  async function handleRunNow(item) {
    const res = await runAccountSourceNow(item.id);

    if (!res?.success) {
      if (res?.item) upsertItem(res.item);
      showToast("Lỗi", res?.message || "Không thể chạy cron ngay.", true);
      return;
    }

    if (res?.item) upsertItem(res.item);
    showToast("Thành công", res?.message || "Đã chạy cron ngay.", false);
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý nguồn API"
          subtitle="Quản lý các base URL dùng để đồng bộ App Account từ hệ thống bên ngoài."
        />

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Đang tải danh sách nguồn API...
          </div>
        ) : (
          <AccountSourceDataTable
            columns={getColumns({
              onEdit: (item) =>
                setFormModal({
                  open: true,
                  mode: "edit",
                  source: item,
                }),
              onDelete: (item) =>
                setDeleteModal({
                  open: true,
                  source: item,
                }),
              onConfigCron: (item) =>
                setCronModal({
                  open: true,
                  source: item,
                }),
              onRunNow: handleRunNow,
              onToggleActive: handleToggleActive,
            })}
            data={filteredItems}
            searchValue={keyword}
            onSearchChange={setKeyword}
            onCreate={() =>
              setFormModal({
                open: true,
                mode: "create",
                source: null,
              })
            }
          />
        )}
      </div>

      <AccountSourceFormModal
        open={formModal.open}
        mode={formModal.mode}
        source={formModal.source}
        onOpenChange={(nextOpen) =>
          setFormModal((prev) => ({
            ...prev,
            open: nextOpen,
            source: nextOpen ? prev.source : null,
          }))
        }
        onSaved={upsertItem}
        onToast={showToast}
      />

      <AccountSourceCronModal
        open={cronModal.open}
        source={cronModal.source}
        onOpenChange={(nextOpen) =>
          setCronModal({
            open: nextOpen,
            source: nextOpen ? cronModal.source : null,
          })
        }
        onSaved={upsertItem}
        onToast={showToast}
      />

      <AccountSourceDeleteModal
        open={deleteModal.open}
        source={deleteModal.source}
        onOpenChange={(nextOpen) =>
          setDeleteModal({
            open: nextOpen,
            source: nextOpen ? deleteModal.source : null,
          })
        }
        onDeleted={removeItem}
        onToast={showToast}
      />
    </>
  );
}
