"use client";

import * as React from "react";
import SharedAdminDataTable from "@/components/admin/SharedAdminDataTable";
import ShareLinkTableToolbar from "./ShareLinkTableToolbar";

export default function ShareLinkDataTable({
  columns,
  data,
  onCreateClick,
}) {
  const [search, setSearch] = React.useState("");

  return (
    <SharedAdminDataTable
      columns={columns}
      data={data}
      searchValue={search}
      onSearchChange={setSearch}
      searchColumnId="code"
      emptyMessage="Không tìm thấy share link nào."
      minWidthClassName="min-w-[980px]"
      tableHeightClassName="min-h-[20rem] h-[calc(100vh-24rem)] sm:h-[calc(100vh-26rem)] lg:h-[calc(100vh-21rem)]"
      toolbar={
        <ShareLinkTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          onCreateClick={onCreateClick}
        />
      }
    />
  );
}
