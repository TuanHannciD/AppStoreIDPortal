import { prisma } from "@/lib/prisma";

export async function getSharePageDependencySummary(sharePageId) {
  const [passes, sharePageAccounts, shareAuthLogs, sharePassVerifications] =
    await Promise.all([
      prisma.sharePass.count({ where: { sharePageId } }),
      prisma.sharePageAccount.count({ where: { sharePageId } }),
      prisma.shareAuthLog.count({ where: { sharePageId } }),
      prisma.sharePassVerification.count({ where: { sharePageId } }),
    ]);

  return {
    passes,
    sharePageAccounts,
    shareAuthLogs,
    sharePassVerifications,
  };
}

export function hasSharePageDependencies(summary) {
  return (
    summary.passes > 0 ||
    summary.sharePageAccounts > 0 ||
    summary.sharePassVerifications > 0
  );
}
