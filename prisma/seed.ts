import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, ShareLinkDeleteStatus } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASECus_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL for seeding");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function plusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function createPass(shareLinkId: string, plainPass: string, quotaTotal: number, label?: string) {
  return prisma.sharePass.create({
    data: {
      shareLinkId,
      passwordHash: await bcrypt.hash(plainPass, 10),
      quotaTotal,
      quotaUsed: 0,
      label: label ?? null,
    },
  });
}

async function main() {
  const adminPassword = "admin-123456";

  await prisma.shareAuthLog.deleteMany();
  await prisma.shareLinkDeleteLog.deleteMany();
  await prisma.sharePass.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        not: "admin@example.com",
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      password: await bcrypt.hash(adminPassword, 10),
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: "admin@example.com",
      password: await bcrypt.hash(adminPassword, 10),
      role: Role.SUPER_ADMIN,
    },
  });

  const movieShareLink = await prisma.shareLink.create({
    data: {
      code: "MOVIEVIP01",
      appLabel: "Movie VIP",
      appDescription: "Goi chia se tai khoan xem phim premium cho nguoi dung noi bo.",
      apiUrl: "https://example.com/integrations/movie-vip",
      apiMethod: "GET",
      apiKey: "seed-movie-vip-key",
      apiAppId: "movie-vip",
      apiConfig: {
        headers: {
          "x-api-key": "seed-movie-vip-key",
        },
        passField: "password",
        emailField: "email",
      },
      note: "Seed data for admin testing",
      expiresAt: plusDays(30),
      consumeOnVerify: false,
      ownerId: admin.id,
    },
  });

  const musicShareLink = await prisma.shareLink.create({
    data: {
      code: "MUSICPRO01",
      appLabel: "Music Pro",
      appDescription: "Goi share link cho ung dung nghe nhac, du lieu lay tu API ngoai.",
      apiUrl: "https://example.com/integrations/music-pro",
      apiMethod: "POST",
      apiKey: "seed-music-pro-key",
      apiAppId: "music-pro",
      apiConfig: {
        headers: {
          Authorization: "Bearer seed-music-pro-key",
        },
        requestBody: {
          source: "codex-seed",
        },
      },
      note: "Share link co 2 pass de test UI va quota",
      expiresAt: plusDays(60),
      rateEnabled: true,
      rateWindowSec: 120,
      rateMaxRequests: 15,
      consumeOnVerify: true,
      ownerId: admin.id,
    },
  });

  const expiredShareLink = await prisma.shareLink.create({
    data: {
      code: "EXPIRED01",
      appLabel: "Expired Demo",
      appDescription: "Share link het han de test trang thai va log.",
      apiUrl: "https://example.com/integrations/expired-demo",
      apiMethod: "GET",
      apiAppId: "expired-demo",
      note: "Seed share link da het han",
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      rateEnabled: true,
      rateWindowSec: 60,
      rateMaxRequests: 5,
      consumeOnVerify: false,
      ownerId: admin.id,
    },
  });

  const moviePassA = await createPass(movieShareLink.id, "movie-pass-01", 50, "Khach A");
  const moviePassB = await createPass(movieShareLink.id, "movie-pass-02", 50, "Khach B");

  const musicPass = await prisma.sharePass.create({
    data: {
      shareLinkId: musicShareLink.id,
      passwordHash: await bcrypt.hash("music-pass-01", 10),
      quotaTotal: 20,
      quotaUsed: 3,
      label: "Team Music",
      lastVerifiedAt: new Date(),
      lastRevealedAt: new Date(),
    },
  });

  await prisma.sharePass.create({
    data: {
      shareLinkId: expiredShareLink.id,
      passwordHash: await bcrypt.hash("expired-pass-01", 10),
      quotaTotal: 5,
      quotaUsed: 1,
      label: "Expired User",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.shareAuthLog.createMany({
    data: [
      {
        shareLinkId: movieShareLink.id,
        shareLinkCode: movieShareLink.code,
        sharePassId: moviePassA.id,
        sharePassLabel: moviePassA.label,
        action: "VERIFY_PASS",
        success: true,
        message: "Seed verify success",
        ipAddress: "127.0.0.1",
        userAgent: "seed-script/1.0",
      },
      {
        shareLinkId: movieShareLink.id,
        shareLinkCode: movieShareLink.code,
        sharePassId: moviePassB.id,
        sharePassLabel: moviePassB.label,
        action: "INVALID_PASS",
        success: false,
        message: "Seed invalid pass attempt",
        ipAddress: "127.0.0.1",
        userAgent: "seed-script/1.0",
      },
      {
        shareLinkId: musicShareLink.id,
        shareLinkCode: musicShareLink.code,
        sharePassId: musicPass.id,
        sharePassLabel: musicPass.label,
        action: "REVEAL",
        success: true,
        message: "Seed reveal success",
        ipAddress: "127.0.0.1",
        userAgent: "seed-script/1.0",
      },
      {
        shareLinkId: expiredShareLink.id,
        shareLinkCode: expiredShareLink.code,
        action: "LINK_EXPIRED",
        success: false,
        message: "Seed expired link access",
        ipAddress: "127.0.0.1",
        userAgent: "seed-script/1.0",
      },
    ],
  });

  await prisma.shareLinkDeleteLog.create({
    data: {
      actorUserId: admin.id,
      actorEmail: admin.email,
      shareLinkCode: "OLD-DELETED-01",
      appLabel: "Old Removed App",
      reason: "Seed delete log for audit screen",
      status: ShareLinkDeleteStatus.DELETED,
      dependencySummary: {
        passes: 3,
        authLogs: 12,
      },
    },
  });

  const [users, shareLinks, sharePasses, authLogs, deleteLogs] = await Promise.all([
    prisma.user.count(),
    prisma.shareLink.count(),
    prisma.sharePass.count(),
    prisma.shareAuthLog.count(),
    prisma.shareLinkDeleteLog.count(),
  ]);

  console.log("Seed completed");
  console.log({
    users,
    shareLinks,
    sharePasses,
    authLogs,
    deleteLogs,
  });
  console.log("Admin login", {
    email: "admin@example.com",
    password: adminPassword,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
