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

export function getColumns(actions) {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            type="button"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-mono">{row.getValue("code")}</div>;
      },
    },
    {
      accessorKey: "appName",
      header: "App",
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.appName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.appSlug}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => {
        const value = row.getValue("note");
        if (!value) return <span className="text-muted-foreground">-</span>;
        return <div className="max-w-[280px] truncate">{value}</div>;
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires At",
      cell: ({ row }) => fmtDate(row.getValue("expiresAt")),
    },
    {
      accessorKey: "passCount",
      header: "Pass Count",
      cell: ({ row }) => <div>{row.getValue("passCount")}</div>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            type="button"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => actions?.onView?.(item)}>
                View
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => actions?.onManagePasses?.(item)}>
                Manage Passes
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => actions?.onEdit?.(item)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => actions?.onDelete?.(item)}
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
