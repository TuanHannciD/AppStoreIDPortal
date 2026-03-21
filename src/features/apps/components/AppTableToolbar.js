"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AppTableToolbar({
  searchValue,
  onSearchChange,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo tên app, slug, loại gói hoặc ghi chú..."
        className="sm:max-w-sm"
      />

      <Button type="button" onClick={onCreate}>
        Tạo app mới
      </Button>
    </div>
  );
}
