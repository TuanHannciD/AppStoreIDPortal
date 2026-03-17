"use client";

/**
 * File này định nghĩa các cột cho bảng pass trong modal Manage Passes.
 *
 * Mục tiêu của file:
 * - giữ phần "cấu hình table" tách khỏi màn container
 * - giúp SharePassManageModal không bị quá dài
 * - gom logic render cell vào một nơi
 *
 * File này KHÔNG tự quản lý state lớn.
 * Nó chỉ nhận `actions` từ component cha và gọi callback khi user bấm menu.
 */

import { MoreHorizontal } from "lucide-react";
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
  return date.toLocaleString();
}

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

function getStatusTone(status) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "REVOKED") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "EXPIRED") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "EXHAUSTED") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function getPassColumns(actions = {}) {
  /**
   * `actions`
   * Là object callback do component cha truyền xuống.
   *
   * Ví dụ:
   * - actions.onView(item)
   * - actions.onEdit(item)
   * - actions.onResetUsage(item)
   * - actions.onRevoke(item)
   * - actions.onRestore(item)
   * - actions.onRotate(item)
   *
   * Tác dụng của pattern này:
   * - file cột không cần biết modal được mở như thế nào
   * - component cha vẫn nắm quyền điều phối flow
   */
  return [
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => row.getValue("label") || "-",
    },
    {
      accessorKey: "quotaTotal",
      header: "Quota Total",
    },
    {
      accessorKey: "quotaUsed",
      header: "Quota Used",
    },
    {
      accessorKey: "quotaRemaining",
      header: "Quota Remaining",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") || "UNKNOWN";

        return (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(status)}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => fmtDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
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
              <DropdownMenuLabel>Pass Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => actions?.onView?.(item)}
              >
                View
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => actions?.onEdit?.(item)}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => actions?.onResetUsage?.(item)}
              >
                Reset Usage
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => actions?.onRotate?.(item)}
              >
                Rotate Pass
              </DropdownMenuItem>

              {item.status === "REVOKED" ? (
                <DropdownMenuItem onClick={() => actions?.onRestore?.(item)}>
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => actions?.onRevoke?.(item)}>
                  Revoke
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() =>
                  showToastFallback(`Delete pass ${item.id} is intentionally deferred to keep audit history safe`)
                }
                className="text-red-500"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
