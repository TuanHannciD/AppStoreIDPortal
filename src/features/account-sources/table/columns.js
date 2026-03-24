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

function formatCountdown(value) {
  if (!value) return "-";
  const target = new Date(value).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "Sẵn sàng";

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes}m`;
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

function renderCronBadge(item) {
  if (!item.cronEnabled) return "border-slate-200 bg-slate-50 text-slate-600";
  if (item.cronStatus === "RUNNING") return "border-sky-200 bg-sky-50 text-sky-700";
  if (item.cronStatus === "COOLDOWN") return "border-amber-200 bg-amber-50 text-amber-700";
  if (item.cronStatus === "READY") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getCronLabel(item) {
  if (!item.cronEnabled) return "DISABLED";
  if (item.cronStatus === "RUNNING") return "RUNNING";
  if (item.nextCronRunAt && new Date(item.nextCronRunAt).getTime() > Date.now()) return "COOLDOWN";
  return "READY";
}

export function getColumns(actions) {
  return [
    {
      id: "search",
      accessorFn: (row) => [row.name, row.baseUrl, row.lastCronSummary, row.lastCronError]
        .filter(Boolean)
        .join(" "),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} label="Nguồn API" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <div className="font-medium text-slate-900">{item.name}</div>
            <div className="text-xs text-muted-foreground break-all">{item.baseUrl}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "accountCount",
      header: "App Account",
      cell: ({ row }) => row.original.accountCount || 0,
    },
    {
      accessorKey: "cronEnabled",
      header: "Cron",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1 text-xs">
            <div>
              {item.cronEnabled ? `Mỗi ${item.cronIntervalHours || 1}h` : "Tắt"}
            </div>
            <div className="text-muted-foreground">
              Max {item.cronMaxAccountsPerRun || 1} account/lượt
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "cronStatus",
      header: "Cron trạng thái",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1">
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${renderCronBadge(item)}`}>
              {getCronLabel(item)}
            </span>
            <div className="text-xs text-muted-foreground">
              {item.cronEnabled ? formatCountdown(item.nextCronRunAt) : "-"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "lastCronFinishedAt",
      header: ({ column }) => <SortableHeader column={column} label="Lần chạy gần nhất" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1 text-xs">
            <div>{formatDate(item.lastCronFinishedAt)}</div>
            <div className="max-w-[220px] text-muted-foreground">
              {item.lastCronSummary || item.lastCronError || "Chưa có dữ liệu"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Nguồn",
      cell: ({ row }) => (
        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${
            row.original.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {row.original.isActive ? "Đang hoạt động" : "Đã tắt"}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        const isRunning = item.cronStatus === "RUNNING";

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
              <DropdownMenuItem onClick={() => actions?.onConfigCron?.(item)}>
                Cấu hình cron
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isRunning} onClick={() => !isRunning && actions?.onRunNow?.(item)}>
                {isRunning ? "Đang chạy..." : "Chạy ngay"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions?.onToggleActive?.(item)}>
                {item.isActive ? "Tắt nguồn" : "Kích hoạt lại"}
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
