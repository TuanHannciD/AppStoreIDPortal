"use client";

/**
 * File này là "màn hình điều phối" cho phần Manage Passes trong admin.
 *
 * Nhiệm vụ chính:
 * 1. Tải danh sách pass thuộc một share page.
 * 2. Hiển thị bảng pass + trạng thái hiện tại của từng pass.
 * 3. Mở modal để tạo pass mới.
 * 4. Mở modal action để xem chi tiết / edit / reset usage / rotate / revoke / restore.
 * 5. Đồng bộ lại bảng sau khi user vừa thao tác trên một pass.
 *
 * Bản thiết kế này ưu tiên mobile:
 * - modal chiếm gần full màn hình trên điện thoại
 * - header/footer rõ ràng
 * - phần nội dung cuộn dọc riêng
 * - bảng vẫn giữ scroll ngang thay vì ép vỡ layout
 */

import { useEffect, useMemo, useState } from "react";
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

import { fetchSharePagePasses } from "../../api/sharePage.api";
import { mapSharePassesToTableRows } from "../../lib/sharePass.table.mapper";
import { getPassColumns } from "../../table/pass-columns";
import SharePassCreateModal from "./SharePassCreateModal";
import SharePassActionModal from "./SharePassActionModal";
import SharePageAccountManageModal from "./SharePageAccountManageModal";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function SharePassManageModal({
  open,
  sharePageId,
  onOpenChange,
}) {
  const [loading, setLoading] = useState(false);
  const [sharePage, setSharePage] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [accountManageOpen, setAccountManageOpen] = useState(false);

  /**
   * `actionModal`
   * Giữ trạng thái của modal thao tác cho một pass.
   *
   * `mode` quyết định modal đang mở theo flow nào.
   * `pass` là row hiện tại đang được thao tác.
   */
  const [actionModal, setActionModal] = useState({
    open: false,
    mode: "view",
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

  /**
   * Cập nhật đúng row vừa đổi để UI phản hồi tức thì
   * mà không cần refetch toàn bộ danh sách.
   */
  function handlePassUpdated(updatedPass) {
    setRows((prev) =>
      prev.map((item) => (item.id === updatedPass.id ? updatedPass : item)),
    );
  }

  async function loadPasses() {
    if (!sharePageId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchSharePagePasses(sharePageId);
      if (!res?.success) {
        setError(res?.message || "Failed to load passes");
        setSharePage(null);
        setRows([]);
        return;
      }

      setSharePage(res.sharePage || null);
      setRows(mapSharePassesToTableRows(res.items || []));
    } catch (err) {
      setError(String(err?.message || err));
      setSharePage(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !sharePageId) return;
    loadPasses();
  }, [open, sharePageId]);

  const columns = useMemo(
    () =>
      getPassColumns({
        onView: (item) => openAction("view", item),
        onEdit: (item) => openAction("edit", item),
        onResetUsage: (item) => openAction("resetUsage", item),
        onRotate: (item) => openAction("rotate", item),
        onRevoke: (item) => openAction("revoke", item),
        onRestore: (item) => openAction("restore", item),
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
        <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden p-0 sm:h-[90vh] sm:w-[95vw]">
          <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
            <DialogTitle>Manage Passes</DialogTitle>
            <DialogDescription>
              Quan ly quota va trang thai cua share link da chon.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && sharePage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm lg:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Share Link
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 sm:grid-cols-[120px_1fr]">
                      <div className="text-muted-foreground">Code</div>
                      <div className="break-all font-mono">{sharePage.code}</div>

                      <div className="text-muted-foreground">App</div>
                      <div>{sharePage.app?.name || "-"}</div>

                      <div className="text-muted-foreground">App Slug</div>
                      <div className="break-all">{sharePage.app?.slug || "-"}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Policy
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 sm:grid-cols-[120px_1fr]">
                      <div className="text-muted-foreground">Expires At</div>
                      <div>{fmtDate(sharePage.expiresAt)}</div>

                      <div className="text-muted-foreground">Note</div>
                      <div className="break-words">{sharePage.note || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Review status and manage each pass from the actions menu.
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAccountManageOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Manage Accounts
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Add Pass
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-md border">
                  <ScrollArea className="h-[52vh] w-full sm:h-[320px]">
                    <div className="min-w-[760px] pb-2 sm:min-w-[900px]">
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
                                No passes found.
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
        sharePageId={sharePageId}
        onOpenChange={setCreateOpen}
        onCreated={loadPasses}
      />

      <SharePassActionModal
        open={actionModal.open}
        sharePageId={sharePageId}
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

      <SharePageAccountManageModal
        open={accountManageOpen}
        sharePageId={sharePageId}
        onOpenChange={setAccountManageOpen}
        onToast={showToast}
      />
    </>
  );
}
