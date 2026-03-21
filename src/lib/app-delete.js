import { prisma } from "@/lib/prisma";

/**
 * Tổng hợp nhanh số lượng bản ghi sẽ bị ảnh hưởng nếu xóa một app.
 *
 * Dữ liệu này phục vụ 2 mục đích:
 * - chặn safe delete khi app còn phụ thuộc
 * - hiển thị cảnh báo rõ ràng trước khi force delete
 */
export async function getAppDependencySummary(appId) {
  const sharePages = await prisma.sharePage.findMany({
    where: { appId },
    select: { id: true, code: true },
  });

  const sharePageIds = sharePages.map((item) => item.id);

  const [appAccounts, sharePasses, sharePageAccounts, shareAuthLogs, sharePassVerifications] =
    await Promise.all([
      prisma.appAccount.count({ where: { appId } }),
      sharePageIds.length
        ? prisma.sharePass.count({
            where: { sharePageId: { in: sharePageIds } },
          })
        : 0,
      sharePageIds.length
        ? prisma.sharePageAccount.count({
            where: { sharePageId: { in: sharePageIds } },
          })
        : 0,
      sharePageIds.length
        ? prisma.shareAuthLog.count({
            where: { sharePageId: { in: sharePageIds } },
          })
        : 0,
      sharePageIds.length
        ? prisma.sharePassVerification.count({
            where: { sharePageId: { in: sharePageIds } },
          })
        : 0,
    ]);

  return {
    appAccounts,
    sharePages: sharePages.length,
    sharePageCodes: sharePages.map((item) => item.code),
    sharePasses,
    sharePageAccounts,
    shareAuthLogs,
    sharePassVerifications,
  };
}

export function hasAppDependencies(summary) {
  return (
    summary.appAccounts > 0 ||
    summary.sharePages > 0 ||
    summary.sharePasses > 0 ||
    summary.sharePageAccounts > 0 ||
    summary.shareAuthLogs > 0 ||
    summary.sharePassVerifications > 0
  );
}
