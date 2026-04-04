"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { fetchShareLinks } from "../api/shareLink.api";
import { mapShareLinksToTableRows } from "../lib/shareLink.table.mapper";
import { getColumns } from "../table/columns";
import ShareLinkDataTable from "./ShareLinkDataTable";
import ShareLinkCreateModal from "./modals/ShareLinkCreateModal";
import ShareLinkDeleteModal from "./modals/ShareLinkDeleteModal";
import ShareLinkDetailModal from "./modals/ShareLinkDetailModal";
import ShareLinkEditModal from "./modals/ShareLinkEditModal";
import SharePassManageModal from "./modals/SharePassManageModal";

function showToast(title, message, isInfo = false) {
  if (typeof window !== "undefined" && window.showToast) {
    window.showToast(title, message, isInfo);
    return;
  }

  if (typeof window !== "undefined") {
    alert(message);
  }
}

export default function ShareLinkAdminScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createRequested = searchParams.get("create") === "1";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    type: createRequested ? "create" : null,
    shareLinkId: null,
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchShareLinks();

      if (!res?.success) {
        setError(res?.message || "Không thể tải danh sách share link.");
        setRows([]);
        return;
      }

      setRows(mapShareLinksToTableRows(res.items || []));
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

  useEffect(() => {
    if (createRequested) {
      setModal((current) => {
        if (current.type === "create") {
          return current;
        }

        return {
          type: "create",
          shareLinkId: null,
        };
      });
    }
  }, [createRequested]);

  const selectedRow = useMemo(
    () => rows.find((item) => item.id === modal.shareLinkId) || null,
    [modal.shareLinkId, rows],
  );

  const columns = useMemo(() => {
    return getColumns({
      onView: (row) =>
        setModal({
          type: "detail",
          shareLinkId: row.id,
        }),
      onManagePasses: (row) =>
        setModal({
          type: "managePasses",
          shareLinkId: row.id,
        }),
      onEdit: (row) =>
        setModal({
          type: "edit",
          shareLinkId: row.id,
        }),
      onDelete: (row) =>
        setModal({
          type: "delete",
          shareLinkId: row.id,
        }),
    });
  }, []);

  function replaceCreateQuery(enabled) {
    const params = new URLSearchParams(searchParams.toString());

    if (enabled) {
      params.set("create", "1");
    } else {
      params.delete("create");
    }

    const query = params.toString();
    router.replace(query ? `/admin/share-pages?${query}` : "/admin/share-pages", {
      scroll: false,
    });
  }

  function openCreateModal() {
    setModal({
      type: "create",
      shareLinkId: null,
    });
    replaceCreateQuery(true);
  }

  function closeModal() {
    const wasCreateModal = modal.type === "create" || createRequested;

    setModal({
      type: null,
      shareLinkId: null,
    });

    if (wasCreateModal) {
      replaceCreateQuery(false);
    }
  }

  function removeShareLink(shareLinkId) {
    setRows((prev) => prev.filter((item) => item.id !== shareLinkId));
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Share Links"
          subtitle="Danh sách share link đang có trong hệ thống."
        />

        {loading ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Đang tải danh sách share link...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="min-h-0 flex-1">
            <ShareLinkDataTable
              columns={columns}
              data={rows}
              onCreateClick={openCreateModal}
            />
          </div>
        ) : null}
      </div>

      <ShareLinkCreateModal
        open={modal.type === "create"}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
        onCreated={loadData}
      />

      <ShareLinkDetailModal
        open={modal.type === "detail"}
        shareLinkId={modal.shareLinkId}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
        onManagePasses={(detail) =>
          setModal({
            type: "managePasses",
            shareLinkId: detail.id,
          })
        }
        onEdit={(detail) =>
          setModal({
            type: "edit",
            shareLinkId: detail.id,
          })
        }
      />

      <SharePassManageModal
        open={modal.type === "managePasses"}
        shareLinkId={modal.shareLinkId}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
      />

      <ShareLinkEditModal
        open={modal.type === "edit"}
        shareLinkId={modal.shareLinkId}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
        onSaved={loadData}
      />

      <ShareLinkDeleteModal
        open={modal.type === "delete"}
        shareLink={selectedRow}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
        onDeleted={removeShareLink}
        onToast={showToast}
      />
    </>
  );
}
