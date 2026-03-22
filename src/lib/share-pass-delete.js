import { prisma } from "@/lib/prisma";

export async function getSharePassDependencySummary(sharePassId) {
  const [sharePassVerifications, shareAuthLogs] = await Promise.all([
    prisma.sharePassVerification.count({ where: { sharePassId } }),
    prisma.shareAuthLog.count({ where: { sharePassId } }),
  ]);

  return {
    sharePassVerifications,
    shareAuthLogs,
  };
}

export function hasSharePassDependencies(summary) {
  return summary.sharePassVerifications > 0;
}
