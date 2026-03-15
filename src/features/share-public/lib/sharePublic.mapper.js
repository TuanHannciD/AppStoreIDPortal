/**
 * Map metadata public từ API sang object dễ render hơn.
 */
export function mapSharePublicItem(item) {
  if (!item) return null;

  return {
    code: item.code,
    note: item.note ?? "",
    expiresAt: item.expiresAt ?? null,
    consumeOnVerify: Boolean(item.consumeOnVerify),
    app: {
      id: item.app?.id ?? "",
      name: item.app?.name ?? "-",
      slug: item.app?.slug ?? "-",
      packageType: item.app?.packageType ?? "-",
      description: item.app?.description ?? "",
    },
  };
}