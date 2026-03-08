export function mapSharePageDetail(item) {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    note: item.note ?? "",
    expiresAt: item.expiresAt ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    passCount: item._count?.passes ?? 0,
    app: {
      id: item.app?.id ?? "",
      name: item.app?.name ?? "-",
      slug: item.app?.slug ?? "-",
      packageType: item.app?.packageType ?? "-",
      description: item.app?.description ?? "",
    },
  };
}