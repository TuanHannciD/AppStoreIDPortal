"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccountSourceTableToolbar({
  searchValue,
  onSearchChange,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo tên nguồn hoặc base URL..."
        className="xl:max-w-md"
      />

      <Button type="button" onClick={onCreate}>
        Tạo nguồn API
      </Button>
    </div>
  );
}
