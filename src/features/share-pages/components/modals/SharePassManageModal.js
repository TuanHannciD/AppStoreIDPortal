"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { fetchShareLinkPasses } from "../../api/shareLink.api";
import { mapSharePassesToTableRows } from "../../lib/sharePass.table.mapper";
import { getPassColumns } from "../../table/pass-columns";
import SharePassCreateModal from "./SharePassCreateModal";
import SharePassActionModal from "./SharePassActionModal";
import SharePassDeleteModal from "./SharePassDeleteModal";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function SharePassManageModal({
  open,
  shareLinkId,
  onOpenChange,
}) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [actionModal, setActionModal] = useState({
    open: false,
    mode: "view",
    pass: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    pass: null,
  });

  function showToast(title, message, isInfo = false) {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(title, message, isInfo);
    }
  }

  function openAction(mode, pass) {
    setActionModal({
      open: true,
      mode,
      pass,
    });
  }

  function openDelete(pass) {
    setDeleteModal({
      open: true,
      pass,
    });
  }

  function handlePassUpdated(updatedPass) {
    setRows((prev) =>
      prev.map((item) => (item.id === updatedPass.id ? updatedPass : item)),
    );
  }

  function handlePassDeleted(passId) {
    setRows((prev) => prev.filter((item) => item.id !== passId));
  }

  const loadPasses = useCallback(async () => {
    if (!shareLinkId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchShareLinkPasses(shareLinkId);
      if (!res?.success) {
        setError(res?.message || "Không thể tải danh sách pass");
        setShareLink(null);
        setRows([]);
        return;
      }

      setShareLink(res.shareLink || null);
      setRows(mapSharePassesToTableRows(res.items || []));
    } catch (err) {
      setError(String(err?.message || err));
      setShareLink(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [shareLinkId]);

  useEffect(() => {
    if (!open || !shareLinkId) return;
    loadPasses();
  }, [open, shareLinkId, loadPasses]);

  const columns = useMemo(
    () =>
      getPassColumns({
        onView: (item) => openAction("view", item),
        onEdit: (item) => openAction("edit", item),
        onResetUsage: (item) => openAction("resetUsage", item),
        onRotate: (item) => openAction("rotate", item),
        onRevoke: (item) => openAction("revoke", item),
        onRestore: (item) => openAction("restore", item),
        onDelete: (item) => openDelete(item),
      }),
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(96vw,78rem)] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4 md:px-6">
            <DialogTitle>Quản lý pass</DialogTitle>
            <DialogDescription>
              Quản lý quota và trạng thái của share link đã chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(88vh-7rem)] overflow-y-auto px-5 py-5 md:px-6">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">
                Đang tải dữ liệu...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && shareLink ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 text-sm xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div className="rounded-lg border p-4 lg:p-5">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Share link
                    </div>
                    <div className="grid grid-cols-[92px_1fr] gap-x-4 gap-y-3 sm:grid-cols-[128px_1fr]">
                      <div className="text-muted-foreground">Mã</div>
                      <div className="break-all font-mono">{shareLink.code}</div>

                      <div className="text-muted-foreground">App</div>
                      <div>{shareLink.app?.name || "-"}</div>

                      <div className="text-muted-foreground">Slug app</div>
                      <div className="break-all">{shareLink.app?.slug || "-"}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 lg:p-5">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Chính sách
                    </div>
                    <div className="grid grid-cols-[92px_1fr] gap-x-4 gap-y-3 sm:grid-cols-[128px_1fr]">
                      <div className="text-muted-foreground">Hết hạn</div>
                      <div>{fmtDate(shareLink.expiresAt)}</div>

                      <div className="text-muted-foreground">Ghi chú</div>
                      <div className="break-words">{shareLink.note || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border bg-slate-50/50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl text-sm text-muted-foreground">
                    Theo dõi trạng thái và thao tác với từng pass từ menu hành động.
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Thêm pass
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                  <ScrollArea className="h-[min(52vh,32rem)] w-full">
                    <div className="min-w-[980px] pb-2">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>

                        <TableBody>
                          {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                              <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                              >
                                Chưa có pass nào.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <SharePassCreateModal
        open={createOpen}
        shareLinkId={shareLinkId}
        onOpenChange={setCreateOpen}
        onCreated={loadPasses}
      />

      <SharePassActionModal
        open={actionModal.open}
        shareLinkId={shareLinkId}
        mode={actionModal.mode}
        pass={actionModal.pass}
        onOpenChange={(nextOpen) =>
          setActionModal((prev) => ({
            ...prev,
            open: nextOpen,
            pass: nextOpen ? prev.pass : null,
          }))
        }
        onUpdated={handlePassUpdated}
        onToast={showToast}
      />

      <SharePassDeleteModal
        open={deleteModal.open}
        shareLinkId={shareLinkId}
        shareLinkCode={shareLink?.code || ""}
        pass={deleteModal.pass}
        onOpenChange={(nextOpen) =>
          setDeleteModal((prev) => ({
            ...prev,
            open: nextOpen,
            pass: nextOpen ? prev.pass : null,
          }))
        }
        onDeleted={handlePassDeleted}
        onToast={showToast}
      />
    </>
  );
}
