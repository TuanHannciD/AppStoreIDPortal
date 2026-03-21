"use client";

import SharedAdminDataTable from "@/components/admin/SharedAdminDataTable";
import AppAccountTableToolbar from "./AppAccountTableToolbar";

export default function AppAccountDataTable({
  columns,
  data,
  apps,
  loadingApps,
  selectedAppId,
  onSelectedAppIdChange,
  searchValue,
  onSearchChange,
  onCreate,
  emptyMessage,
}) {
  return (
    <SharedAdminDataTable
      columns={columns}
      data={data}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchColumnId="search"
      emptyMessage={emptyMessage}
      minWidthClassName="min-w-[1180px]"
      tableHeightClassName="min-h-[20rem] h-[calc(100vh-23rem)] sm:h-[calc(100vh-25rem)] lg:h-[calc(100vh-17rem)]"
      toolbar={
        <AppAccountTableToolbar
          apps={apps}
          loadingApps={loadingApps}
          selectedAppId={selectedAppId}
          onSelectedAppIdChange={onSelectedAppIdChange}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onCreate={onCreate}
        />
      }
    />
  );
}
