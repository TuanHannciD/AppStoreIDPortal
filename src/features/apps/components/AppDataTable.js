"use client";

import SharedAdminDataTable from "@/components/admin/SharedAdminDataTable";
import AppTableToolbar from "./AppTableToolbar";

export default function AppDataTable({
  columns,
  data,
  searchValue,
  onSearchChange,
  onCreate,
}) {
  return (
    <SharedAdminDataTable
      columns={columns}
      data={data}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchColumnId="search"
      emptyMessage="Chưa có app nào phù hợp với điều kiện tìm kiếm."
      minWidthClassName="min-w-[1080px]"
      tableHeightClassName="min-h-[20rem] h-[calc(100vh-21rem)] sm:h-[calc(100vh-23rem)] lg:h-[calc(100vh-17rem)]"
      toolbar={
        <AppTableToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onCreate={onCreate}
        />
      }
    />
  );
}
