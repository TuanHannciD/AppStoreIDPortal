import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { Role } from "../src/generated/prisma/enums";

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!, // seed/migrate: dùng DIRECT 5432
});

const prisma = new PrismaClient({ adapter });

const INT_MAX = 2147483647;

function sha256(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function nowPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function nowMinusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  // 1) One SUPER_ADMIN user
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: sha256("admin-123456"), // demo hash; production dùng bcrypt/argon2
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.shareAuthLog.deleteMany();
  await prisma.sharePassVerification.deleteMany();
  await prisma.sharePageAccount.deleteMany();
  await prisma.sharePass.deleteMany();
  await prisma.sharePage.deleteMany();
  await prisma.appAccount.deleteMany();
  await prisma.app.deleteMany();
  await prisma.apiSourceConfig.deleteMany();

  const appleProSource = await prisma.apiSourceConfig.upsert({
    where: { id: "seed-applepro-source" },
    update: {
      name: "ApplePro Seed",
      baseUrl: "https://applepro.yuichycsa.id.vn/shareapi",
      isActive: true,
    },
    create: {
      id: "seed-applepro-source",
      name: "ApplePro Seed",
      baseUrl: "https://applepro.yuichycsa.id.vn/shareapi",
      isActive: true,
    },
  });

  const backupSource = await prisma.apiSourceConfig.upsert({
    where: { id: "seed-backup-source" },
    update: {
      name: "Backup Source",
      baseUrl: "https://backup.example.com/shareapi",
      isActive: false,
    },
    create: {
      id: "seed-backup-source",
      name: "Backup Source",
      baseUrl: "https://backup.example.com/shareapi",
      isActive: false,
    },
  });

  // Helper create App
  async function createApp(i: number, group: string) {
    return prisma.app.create({
      data: {
        slug: `${group}-app-${i}`,
        name: `${group.toUpperCase()} App ${i}`,
        packageType: "test",
        description: `Seed group=${group}`,
        ownerId: user.id,
      },
    });
  }

  async function createAppAccounts(appId: string, group: string, appIndex: number) {
    const syncedAccount = await prisma.appAccount.create({
      data: {
        appId,
        title: `${group.toUpperCase()} Synced Account ${appIndex}`,
        email: `app${group}${appIndex}.01@appstoreviet.com`,
        username: `app${group}${appIndex}.01@appstoreviet.com`,
        password: `Asv_${group}_${appIndex}_01`,
        note: "Seed synced account from external API",
        isActive: true,
        apiSourceConfigId: appleProSource.id,
        externalKey: `test-${group}-${appIndex}-01`,
        lastSyncedAt: new Date(),
        lastSyncStatus: "SUCCESS",
        lastSyncError: null,
      },
    });

    const manualAccount = await prisma.appAccount.create({
      data: {
        appId,
        title: `${group.toUpperCase()} Manual Account ${appIndex}`,
        email: `manual.${group}.${appIndex}@example.com`,
        username: `manual-${group}-${appIndex}`,
        password: `Manual_${group}_${appIndex}`,
        note: "Seed manual account without external sync",
        isActive: appIndex % 4 !== 0,
        apiSourceConfigId: appIndex % 2 === 0 ? backupSource.id : null,
        externalKey: appIndex % 2 === 0 ? `backup-${group}-${appIndex}` : null,
        lastSyncedAt: appIndex % 2 === 0 ? nowMinusDays(1) : null,
        lastSyncStatus: appIndex % 2 === 0 ? "FAILED" : null,
        lastSyncError: appIndex % 2 === 0 ? "Seed timeout from backup source" : null,
      },
    });

    return [syncedAccount, manualAccount];
  }

  // Helper create SharePage + passes + logs
  async function createPageBundle(appId: string, pageIdx: number, opts: {
    expired?: boolean;
    maxLimits?: boolean;
    quotaNearlyExhausted?: boolean;
    revokedPasses?: boolean;
  }) {
    const code = `${appId.slice(0, 6).toUpperCase()}-${String(pageIdx).padStart(2, "0")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const page = await prisma.sharePage.create({
      data: {
        code,
        appId,
        note: `Seed page ${pageIdx}`,
        expiresAt: opts.expired ? nowMinusDays(1) : null,

        // max policy if requested
        rateEnabled: true,
        rateWindowSec: opts.maxLimits ? INT_MAX : 60,
        rateMaxRequests: opts.maxLimits ? INT_MAX : 30,

        passQuotaTotal: opts.maxLimits ? INT_MAX : 50,
        consumeOnVerify: true,
      },
    });

    // 10 SharePass per page
    const passData = Array.from({ length: 10 }).map((_, j) => {
      const rawPass = `pass-${pageIdx}-${j}`;
      const revoked = opts.revokedPasses && j % 3 === 0; // revoke ~1/3
      const quotaTotal = opts.maxLimits ? INT_MAX : 100;

      let quotaUsed = 0;
      if (opts.quotaNearlyExhausted) {
        quotaUsed = Math.max(0, quotaTotal - 1); // gần hết
      }

      return {
        sharePageId: page.id,
        passwordHash: sha256(rawPass),
        quotaTotal,
        quotaUsed,
        revokedAt: revoked ? new Date() : null,
        reason: revoked ? "ADMIN_REVOKED" : null,
        expiresAt: opts.expired ? nowMinusDays(1) : null,
        lastVerifiedAt: null,
      };
    });

    // createMany returns count only; we need ids for logs → create individually OR query after insert
    await prisma.sharePass.createMany({ data: passData });

    const passes = await prisma.sharePass.findMany({
      where: { sharePageId: page.id },
      select: { id: true },
    });

    // 10 logs per page (mix success/fail, some rate/quota blocks)
    const logData = Array.from({ length: 10 }).map((_, k) => {
      const kind = k % 5;
      const action =
        kind === 0 ? "VERIFY_PASS" :
        kind === 1 ? "REVEAL" :
        kind === 2 ? "API_CALL" :
        kind === 3 ? "RATE_LIMIT_BLOCK" :
                     "QUOTA_BLOCK";

      const success = action === "RATE_LIMIT_BLOCK" || action === "QUOTA_BLOCK" ? false : (k % 2 === 0);
      const sharePassId = passes.length ? passes[k % passes.length].id : null;

      return {
        sharePageId: page.id,
        sharePassId,
        action,
        success,
        message: `seed log ${k} (${action})`,
        ipAddress: `192.168.1.${k + 10}`,
        userAgent: "seed-agent/1.0",
      };
    });

    await prisma.shareAuthLog.createMany({ data: logData });

    return page;
  }

  // 2) Create groups, each group creates 10 apps; each app 10 pages; each page 10 passes/logs
  const groups: Array<{ name: string; opts: Parameters<typeof createPageBundle>[2] }> = [
    { name: "normal", opts: { expired: false, maxLimits: false, quotaNearlyExhausted: false, revokedPasses: false } },
    { name: "max", opts: { expired: false, maxLimits: true, quotaNearlyExhausted: false, revokedPasses: false } },
    { name: "expired", opts: { expired: true, maxLimits: true, quotaNearlyExhausted: false, revokedPasses: false } },
    { name: "edge", opts: { expired: false, maxLimits: true, quotaNearlyExhausted: true, revokedPasses: true } },
  ];

  for (const g of groups) {
    for (let i = 1; i <= 10; i++) {
      const app = await createApp(i, g.name);
      const appAccounts = await createAppAccounts(app.id, g.name, i);
      const createdPages: Array<{ id: string }> = [];

      for (let p = 1; p <= 10; p++) {
        const page = await createPageBundle(app.id, p, g.opts);
        createdPages.push({ id: page.id });
      }

      for (let pageIdx = 0; pageIdx < createdPages.length; pageIdx += 1) {
        const page = createdPages[pageIdx];
        await prisma.sharePageAccount.createMany({
          data: appAccounts.map((account, accountIdx) => ({
            sharePageId: page.id,
            appAccountId: account.id,
            sortOrder: accountIdx,
            isActive: pageIdx % 5 !== 0 || accountIdx === 0,
          })),
        });
      }

      const firstPage = createdPages[0];
      if (firstPage) {
        const passes = await prisma.sharePass.findMany({
          where: { sharePageId: firstPage.id },
          select: { id: true },
          take: 3,
        });

        await prisma.sharePassVerification.createMany({
          data: passes.map((pass, idx) => ({
            token: `verify-${g.name}-${i}-${idx}-${crypto.randomBytes(6).toString("hex")}`,
            sharePageId: firstPage.id,
            sharePassId: pass.id,
            expiresAt: nowPlusDays(1),
            consumedAt: idx === 2 ? new Date() : null,
          })),
        });
      }
    }
  }

  // quick counts
  const [u, apiSources, a, appAccounts, sp, spa, pass, verifications, log] = await Promise.all([
    prisma.user.count(),
    prisma.apiSourceConfig.count(),
    prisma.app.count(),
    prisma.appAccount.count(),
    prisma.sharePage.count(),
    prisma.sharePageAccount.count(),
    prisma.sharePass.count(),
    prisma.sharePassVerification.count(),
    prisma.shareAuthLog.count(),
  ]);

  console.log("✅ Seed done");
  console.log({
    users: u,
    apiSources,
    apps: a,
    appAccounts,
    sharePages: sp,
    sharePageAccounts: spa,
    sharePasses: pass,
    sharePassVerifications: verifications,
    shareAuthLogs: log,
  });
  console.log("Login demo:", { email: "admin@example.com", password: "admin-123456" });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
