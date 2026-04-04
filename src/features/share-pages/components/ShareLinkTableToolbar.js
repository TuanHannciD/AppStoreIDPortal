"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ShareLinkTableToolbar({
  searchValue,
  onSearchChange,
  onCreateClick,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo mã share link..."
        className="w-full sm:max-w-sm"
      />

      <Button
        type="button"
        onClick={onCreateClick}
        className="w-full sm:w-auto"
      >
        Tạo share link
      </Button>
    </div>
  );
}
