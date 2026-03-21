"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDate(value) {
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

function renderIdentity(item) {
  return item.email || item.username || item.title || item.id;
}

export function getColumns(actions) {
  return [
    {
      id: "search",
      accessorFn: (row) =>
        [row.title, row.email, row.username, row.note].filter(Boolean).join(" "),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} label="Tài khoản" />,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div>
            <div className="font-medium text-slate-900">{renderIdentity(item)}</div>
            <div className="text-xs text-muted-foreground">
              {item.title || "Chưa đặt tiêu đề"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "Tên đăng nhập",
      cell: ({ row }) => row.original.username || "-",
    },
    {
      accessorKey: "password",
      header: "Mật khẩu",
      cell: ({ row }) => {
        const value = row.original.password;
        if (!value) return "-";
        return <span className="font-mono text-xs">{value}</span>;
      },
    },
    {
      accessorKey: "twoFaKey",
      header: "2FA",
      cell: ({ row }) => {
        const value = row.original.twoFaKey;
        if (!value) return "-";
        return <span className="font-mono text-xs">{value}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${
            row.original.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {row.original.isActive ? "Đang hoạt động" : "Ngừng sử dụng"}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <SortableHeader column={column} label="Cập nhật" />,
      cell: ({ row }) => formatDate(row.getValue("updatedAt")),
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
              <DropdownMenuItem onClick={() => actions?.onEdit?.(item)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions?.onToggleActive?.(item)}>
                {item.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions?.onDelete?.(item)}
                className="text-red-600"
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
