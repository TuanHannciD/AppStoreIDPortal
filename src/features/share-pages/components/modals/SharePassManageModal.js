"use client";

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

  const columns = useMemo(() => getPassColumns(), []);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] !max-w-6xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
            <DialogTitle>Manage Passes</DialogTitle>
            <DialogDescription>
              Quản lý quota và trạng thái của share link đã chọn.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6">
            {loading && (
              <div className="py-10 text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && sharePage && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="grid grid-cols-[90px_1fr] gap-2 sm:grid-cols-[120px_1fr]">
                    <div className="text-muted-foreground">Code</div>
                    <div className="font-mono">{sharePage.code}</div>

                    <div className="text-muted-foreground">App</div>
                    <div>{sharePage.app?.name || "-"}</div>

                    <div className="text-muted-foreground">App Slug</div>
                    <div>{sharePage.app?.slug || "-"}</div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] gap-2 sm:grid-cols-[120px_1fr]">
                    <div className="text-muted-foreground">Expires At</div>
                    <div>{fmtDate(sharePage.expiresAt)}</div>

                    <div className="text-muted-foreground">Note</div>
                    <div>{sharePage.note || "-"}</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setCreateOpen(true)}>
                    Add Pass
                  </Button>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="h-[320px] w-full">
                    <div className="min-w-[900px] pb-2">
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SharePassCreateModal
        open={createOpen}
        sharePageId={sharePageId}
        onOpenChange={setCreateOpen}
        onCreated={loadPasses}
      />
    </>
  );
}
