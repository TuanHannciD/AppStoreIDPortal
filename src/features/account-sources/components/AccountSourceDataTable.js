"use client";

import SharedAdminDataTable from "@/components/admin/SharedAdminDataTable";
import AccountSourceTableToolbar from "./AccountSourceTableToolbar";

export default function AccountSourceDataTable({
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
      emptyMessage="Chưa có nguồn API nào phù hợp với điều kiện tìm kiếm."
      minWidthClassName="min-w-[980px]"
      tableHeightClassName="min-h-[20rem] h-[calc(100vh-21rem)] sm:h-[calc(100vh-23rem)] lg:h-[calc(100vh-17rem)]"
      toolbar={
        <AccountSourceTableToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onCreate={onCreate}
        />
      }
    />
  );
}
