export function mapSharePageToTableRow(item) {
  return {
    id: item.id,
    code: item.code,
    appName: item.app?.name ?? "-",
    appSlug: item.app?.slug ?? "-",
    note: item.note ?? "",
    expiresAt: item.expiresAt ?? null,
    passCount: item._count?.passes ?? 0,
    createdAt: item.createdAt,
  };
}

export function mapSharePagesToTableRows(items = []) {
  return items.map(mapSharePageToTableRow);
}
