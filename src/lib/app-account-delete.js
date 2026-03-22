import { prisma } from "@/lib/prisma";

export async function getAppAccountDependencySummary(appAccountId) {
  const links = await prisma.sharePageAccount.findMany({
    where: { appAccountId },
    select: {
      sharePageId: true,
      sharePage: {
        select: {
          code: true,
        },
      },
    },
  });

  return {
    sharePageAccounts: links.length,
    sharePageCodes: links
      .map((item) => item.sharePage?.code)
      .filter(Boolean),
  };
}

export function hasAppAccountDependencies(summary) {
  return summary.sharePageAccounts > 0;
}
