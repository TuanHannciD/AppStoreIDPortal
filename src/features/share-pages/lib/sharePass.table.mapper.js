export function mapSharePassToTableRow(item) {
  return {
    id: item.id,
    label: item.label ?? "",
    quotaTotal: item.quotaTotal ?? 0,
    quotaUsed: item.quotaUsed ?? 0,
    quotaRemaining: item.quotaRemaining ?? 0,
    // isActive: Boolean(item.isActive),
    // lastUsedAt: item.lastUsedAt ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

export function mapSharePassesToTableRows(items = []) {
  return items.map(mapSharePassToTableRow);
}
