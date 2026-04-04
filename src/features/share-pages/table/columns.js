"use client";

import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

function SortableHeader({ column, label }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function getColumns(actions) {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => <SortableHeader column={column} label="Mã link" />,
      cell: ({ row }) => <div className="font-mono">{row.getValue("code")}</div>,
    },
    {
      accessorKey: "appLabel",
      header: "Tên ứng dụng",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.appLabel}</div>
          <div className="text-xs text-muted-foreground">{row.original.appDescription || "-"}</div>
        </div>
      ),
    },
    {
      accessorKey: "apiUrl",
      header: "Link nguồn",
      cell: ({ row }) => {
        const value = row.getValue("apiUrl");
        if (!value) return <span className="text-muted-foreground">-</span>;
        return <div className="max-w-[280px] truncate font-mono text-xs">{value}</div>;
      },
    },
    {
      accessorKey: "note",
      header: "Ghi chú",
      cell: ({ row }) => {
        const value = row.getValue("note");
        if (!value) return <span className="text-muted-foreground">-</span>;
        return <div className="max-w-[220px] truncate">{value}</div>;
      },
    },
    {
      accessorKey: "passCount",
      header: "Số pass",
      cell: ({ row }) => <div>{row.getValue("passCount")}</div>,
    },
    {
      accessorKey: "expiresAt",
      header: "Hết hạn",
      cell: ({ row }) => fmtDate(row.getValue("expiresAt")),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Ngày tạo" />,
      cell: ({ row }) => fmtDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => actions?.onView?.(item)}>
                Xem chi tiết
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => actions?.onManagePasses?.(item)}>
                Quản lý pass
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => actions?.onEdit?.(item)}>
                Chỉnh sửa
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => actions?.onDelete?.(item)}
                className="text-red-500"
              >
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
