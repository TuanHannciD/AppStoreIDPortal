"use client";

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

export function getPassColumns() {
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
    // {
    //   accessorKey: "isActive",
    //   header: "Active",
    //   cell: ({ row }) =>
    //     row.getValue("isActive") ? (
    //       <span className="text-emerald-600">Active</span>
    //     ) : (
    //       <span className="text-red-500">Inactive</span>
    //     ),
    // },
    // {
    //   accessorKey: "lastUsedAt",
    //   header: "Last Used At",
    //   cell: ({ row }) => fmtDate(row.getValue("lastUsedAt")),
    // },
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
                onClick={() =>
                  showToastFallback(`View pass ${item.id} is not implemented yet`)
                }
              >
                View
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  showToastFallback(`Reset quota for ${item.id} is not implemented yet`)
                }
              >
                Reset Quota
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  showToastFallback(`Disable pass ${item.id} is not implemented yet`)
                }
              >
                Disable
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  showToastFallback(`Delete pass ${item.id} is not implemented yet`)
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