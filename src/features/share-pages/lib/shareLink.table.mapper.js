export function mapShareLinkToTableRow(item) {
  return {
    id: item.id,
    code: item.code,
    appLabel: item.appLabel ?? "-",
    appName: item.appLabel ?? "-",
    appDescription: item.appDescription ?? "",
    apiUrl: item.apiUrl ?? "",
    note: item.note ?? "",
    expiresAt: item.expiresAt ?? null,
    rateEnabled: Boolean(item.rateEnabled),
    passCount: item._count?.passes ?? 0,
    createdAt: item.createdAt,
  };
}

export function mapShareLinksToTableRows(items = []) {
  return items.map(mapShareLinkToTableRow);
}
