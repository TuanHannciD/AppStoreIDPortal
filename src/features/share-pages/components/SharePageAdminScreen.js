"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSharePages } from "../api/sharePage.api";
import { mapSharePagesToTableRows } from "../lib/sharePage.table.mapper";
import { getColumns } from "../table/columns";
import SharePageDataTable from "./SharePageDataTable";
import SharePageDetailModal from "./modals/SharePageDetailModal";
import SharePassManageModal from "./modals/SharePassManageModal";
import SharePageEditModal from "./modals/SharePageEditModal";

function showToastFallback(message) {
  if (typeof window !== "undefined") {
    if (window.showToast) {
      window.showToast("Info", message, true);
      return;
    }
    console.log(message);
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
        setError(res?.message || "Failed to load share pages");
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
        showToastFallback(`Delete ${row.code} is not implemented yet`),
    });
  }, []);

  function closeModal() {
    setModal({
      type: null,
      sharePageId: null,
    });
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Share Links</h1>
          <p className="text-sm text-muted-foreground">
            Manage created share links and open actions in modals.
          </p>
        </div>

        {loading && (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Loading share links...
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
    </>
  );
}
