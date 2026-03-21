"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SharePageTableToolbar({
  searchValue,
  onSearchChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo mã share link..."
        className="sm:max-w-sm"
      />

      <Button asChild>
        <a href="/admin/share-pages/new">Tạo share link</a>
      </Button>
    </div>
  );
}
