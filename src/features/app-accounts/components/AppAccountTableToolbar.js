"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AppAccountTableToolbar({
  apps,
  loadingApps,
  selectedAppId,
  onSelectedAppIdChange,
  searchValue,
  onSearchChange,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] xl:min-w-0 xl:flex-1">
        <select
          value={selectedAppId}
          onChange={(e) => onSelectedAppIdChange(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          disabled={loadingApps}
        >
          <option value="">
            {loadingApps ? "Đang tải danh sách app..." : "Chọn app"}
          </option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.slug})
            </option>
          ))}
        </select>

        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tiêu đề, email, tên đăng nhập hoặc ghi chú..."
        />
      </div>

      <Button type="button" onClick={onCreate} disabled={!selectedAppId}>
        Tạo tài khoản
      </Button>
    </div>
  );
}
