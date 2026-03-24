import { prisma } from "@/lib/prisma";
import { syncAppAccountById, SyncStatus } from "@/lib/app-account-sync";

const CHECK_INTERVAL_MS = 60 * 1000;

const globalState = globalThis;
if (!globalState.__apiSourceCronState) {
  globalState.__apiSourceCronState = {
    started: false,
    timer: null,
    running: false,
  };
}

function mapApiSource(item) {
  return {
    id: item.id,
    name: item.name,
    baseUrl: item.baseUrl,
    isActive: item.isActive,
    cronEnabled: item.cronEnabled,
    cronIntervalHours: item.cronIntervalHours,
    cronMaxAccountsPerRun: item.cronMaxAccountsPerRun,
    cronStatus: item.cronStatus,
    lastCronStartedAt: item.lastCronStartedAt,
    lastCronFinishedAt: item.lastCronFinishedAt,
    nextCronRunAt: item.nextCronRunAt,
    lastCronSummary: item.lastCronSummary,
    lastCronError: item.lastCronError,
    accountCount: item._count?.appAccounts || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export { mapApiSource };

function computeNextCronRunAt(intervalHours, fromDate = new Date()) {
  const interval = Math.max(1, Number(intervalHours || 1));
  return new Date(fromDate.getTime() + interval * 60 * 60 * 1000);
}

export async function runApiSourceCronById(sourceId, { manual = false } = {}) {
  const source = await prisma.apiSourceConfig.findUnique({
    where: { id: sourceId },
    include: {
      _count: {
        select: {
          appAccounts: true,
        },
      },
    },
  });

  if (!source) {
    return { ok: false, message: "Nguồn API không tồn tại.", item: null };
  }

  if (!source.isActive) {
    const updated = await prisma.apiSourceConfig.update({
      where: { id: source.id },
      data: {
        cronStatus: source.cronEnabled ? "DISABLED" : source.cronStatus,
        lastCronError: "Nguồn API đang tắt.",
      },
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    return { ok: false, message: "Nguồn API đang tắt.", item: updated };
  }

  const intervalHours = Math.max(1, Number(source.cronIntervalHours || 1));
  const maxAccountsPerRun = Math.max(1, Number(source.cronMaxAccountsPerRun || 1));
  const startedAt = new Date();

  await prisma.apiSourceConfig.update({
    where: { id: source.id },
    data: {
      cronStatus: "RUNNING",
      lastCronStartedAt: startedAt,
      lastCronError: null,
    },
  });

  try {
    const accounts = await prisma.appAccount.findMany({
      where: {
        apiSourceConfigId: source.id,
        isActive: true,
      },
      orderBy: [{ lastSyncedAt: "asc" }, { createdAt: "asc" }],
      take: maxAccountsPerRun,
      select: {
        id: true,
        appId: true,
      },
    });

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
      const result = await syncAppAccountById({
        appId: account.appId,
        accountId: account.id,
      });

      const status = result?.item?.lastSyncStatus;
      if (status === SyncStatus.SUCCESS) {
        successCount += 1;
      } else if (status === SyncStatus.SKIPPED) {
        skippedCount += 1;
      } else {
        failedCount += 1;
      }
    }

    const finishedAt = new Date();
    const summary = `total=${accounts.length}, success=${successCount}, failed=${failedCount}, skipped=${skippedCount}`;
    const updated = await prisma.apiSourceConfig.update({
      where: { id: source.id },
      data: {
        cronStatus: source.cronEnabled ? "COOLDOWN" : "IDLE",
        lastCronFinishedAt: finishedAt,
        nextCronRunAt: manual || !source.cronEnabled ? source.nextCronRunAt : computeNextCronRunAt(intervalHours, finishedAt),
        lastCronSummary: summary,
        lastCronError: failedCount > 0 ? `Có ${failedCount} account lỗi trong lần chạy gần nhất.` : null,
      },
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    return {
      ok: true,
      message: summary,
      item: updated,
    };
  } catch (error) {
    const finishedAt = new Date();
    const latestSource = await prisma.apiSourceConfig.findUnique({ where: { id: source.id } });
    const updated = await prisma.apiSourceConfig.update({
      where: { id: source.id },
      data: {
        cronStatus: latestSource?.cronEnabled ? "COOLDOWN" : "IDLE",
        lastCronFinishedAt: finishedAt,
        nextCronRunAt: manual || !latestSource?.cronEnabled
          ? latestSource?.nextCronRunAt || source.nextCronRunAt
          : computeNextCronRunAt(latestSource?.cronIntervalHours || intervalHours, finishedAt),
        lastCronSummary: null,
        lastCronError: String(error?.message || error),
      },
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    return {
      ok: false,
      message: "Chạy cron thất bại.",
      detail: String(error?.message || error),
      item: updated,
    };
  }
}

async function tickApiSourceCron() {
  if (globalState.__apiSourceCronState.running) return;
  globalState.__apiSourceCronState.running = true;

  try {
    const now = new Date();
    const dueSources = await prisma.apiSourceConfig.findMany({
      where: {
        isActive: true,
        cronEnabled: true,
        OR: [
          { nextCronRunAt: null },
          { nextCronRunAt: { lte: now } },
        ],
        NOT: {
          cronStatus: "RUNNING",
        },
      },
      select: {
        id: true,
      },
      orderBy: [{ nextCronRunAt: "asc" }, { updatedAt: "asc" }],
    });

    for (const source of dueSources) {
      await runApiSourceCronById(source.id);
    }
  } catch (error) {
    console.error("api_source_cron_tick_failed", error);
  } finally {
    globalState.__apiSourceCronState.running = false;
  }
}

export function ensureApiSourceCronSchedulerStarted() {
  if (globalState.__apiSourceCronState.started) return;
  globalState.__apiSourceCronState.started = true;
  globalState.__apiSourceCronState.timer = setInterval(() => {
    tickApiSourceCron();
  }, CHECK_INTERVAL_MS);
  tickApiSourceCron();
}
