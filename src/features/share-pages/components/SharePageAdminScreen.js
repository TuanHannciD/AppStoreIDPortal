"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSharePages } from "../api/sharePage.api";
import { mapSharePagesToTableRows } from "../lib/sharePage.table.mapper";
import { getColumns } from "../table/columns";
import SharePageDataTable from "./SharePageDataTable";
import SharePageDetailModal from "./modals/SharePageDetailModal";
import SharePassManageModal from "./modals/SharePassManageModal";
import SharePageEditModal from "./modals/SharePageEditModal";
import SharePageDeleteModal from "./modals/SharePageDeleteModal";
import PageHeader from "@/components/PageHeader";

function showToast(title, message, isInfo = false) {
  if (typeof window !== "undefined" && window.showToast) {
    window.showToast(title, message, isInfo);
    return;
  }

  if (typeof window !== "undefined") {
    alert(message);
  }
}

export default function SharePageAdminScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    type: null,
    sharePageId: null,
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchSharePages();
      if (!res?.success) {
        setError(res?.message || "Không thể tải danh sách share page.");
        setRows([]);
        return;
      }

      setRows(mapSharePagesToTableRows(res.items || []));
    } catch (err) {
      setError(String(err?.message || err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedRow = useMemo(
    () => rows.find((item) => item.id === modal.sharePageId) || null,
    [modal.sharePageId, rows],
  );

  const columns = useMemo(() => {
    return getColumns({
      onView: (row) =>
        setModal({
          type: "detail",
          sharePageId: row.id,
        }),
      onManagePasses: (row) =>
        setModal({
          type: "managePasses",
          sharePageId: row.id,
        }),
      onEdit: (row) =>
        setModal({
          type: "edit",
          sharePageId: row.id,
        }),
      onDelete: (row) =>
        setModal({
          type: "delete",
          sharePageId: row.id,
        }),
    });
  }, []);

  function closeModal() {
    setModal({
      type: null,
      sharePageId: null,
    });
  }

  function removeSharePage(sharePageId) {
    setRows((prev) => prev.filter((item) => item.id !== sharePageId));
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Share Links"
          subtitle="Tạo và quản lý các link chia sẻ"
        />

        {loading && (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Đang tải danh sách share link...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="min-h-0 flex-1">
            <SharePageDataTable columns={columns} data={rows} />
          </div>
        )}
      </div>

      <SharePageDetailModal
        open={modal.type === "detail"}
        sharePageId={modal.sharePageId}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onManagePasses={(detail) =>
          setModal({
            type: "managePasses",
            sharePageId: detail.id,
          })
        }
        onEdit={(detail) =>
          setModal({
            type: "edit",
            sharePageId: detail.id,
          })
        }
      />

      <SharePassManageModal
        open={modal.type === "managePasses"}
        sharePageId={modal.sharePageId}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      />

      <SharePageEditModal
        open={modal.type === "edit"}
        sharePageId={modal.sharePageId}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSaved={loadData}
      />

      <SharePageDeleteModal
        open={modal.type === "delete"}
        sharePage={selectedRow}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onDeleted={removeSharePage}
        onToast={showToast}
      />
    </>
  );
}