"use client";

import * as React from "react";
import SharePageTableToolbar from "./SharePageTableToolbar";
import SharedAdminDataTable from "@/components/admin/SharedAdminDataTable";

export default function SharePageDataTable({ columns, data }) {
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
      tableHeightClassName="min-h-[20rem] h-[calc(100vh-22rem)] sm:h-[calc(100vh-24rem)] lg:h-[calc(100vh-17rem)]"
      toolbar={
        <SharePageTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
        />
      }
    />
  );
}
