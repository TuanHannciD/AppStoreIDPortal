-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "ShareLinkDeleteStatus" AS ENUM ('DELETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "appLabel" TEXT NOT NULL,
    "appDescription" TEXT,
    "apiUrl" TEXT,
    "apiMethod" TEXT DEFAULT 'GET',
    "apiKey" TEXT,
    "apiAppId" TEXT,
    "apiConfig" JSONB,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "rateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rateWindowSec" INTEGER NOT NULL DEFAULT 60,
    "rateMaxRequests" INTEGER NOT NULL DEFAULT 30,
    "passQuotaTotal" INTEGER NOT NULL DEFAULT 50,
    "consumeOnVerify" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePass" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "label" TEXT,
    "quotaTotal" INTEGER NOT NULL,
    "quotaUsed" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "lastRevealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareAuthLog" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT,
    "shareLinkCode" TEXT,
    "sharePassId" TEXT,
    "sharePassLabel" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareAuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLinkDeleteLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "shareLinkId" TEXT,
    "shareLinkCode" TEXT NOT NULL,
    "appLabel" TEXT,
    "reason" TEXT,
    "status" "ShareLinkDeleteStatus" NOT NULL,
    "dependencySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLinkDeleteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_code_key" ON "ShareLink"("code");

-- CreateIndex
CREATE INDEX "ShareLink_createdAt_idx" ON "ShareLink"("createdAt");

-- CreateIndex
CREATE INDEX "ShareLink_ownerId_idx" ON "ShareLink"("ownerId");

-- CreateIndex
CREATE INDEX "SharePass_shareLinkId_idx" ON "SharePass"("shareLinkId");

-- CreateIndex
CREATE INDEX "SharePass_revokedAt_idx" ON "SharePass"("revokedAt");

-- CreateIndex
CREATE INDEX "ShareAuthLog_shareLinkId_createdAt_idx" ON "ShareAuthLog"("shareLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAuthLog_sharePassId_createdAt_idx" ON "ShareAuthLog"("sharePassId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAuthLog_action_createdAt_idx" ON "ShareAuthLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ShareLinkDeleteLog_shareLinkId_createdAt_idx" ON "ShareLinkDeleteLog"("shareLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareLinkDeleteLog_actorUserId_createdAt_idx" ON "ShareLinkDeleteLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareLinkDeleteLog_status_createdAt_idx" ON "ShareLinkDeleteLog"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePass" ADD CONSTRAINT "SharePass_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAuthLog" ADD CONSTRAINT "ShareAuthLog_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAuthLog" ADD CONSTRAINT "ShareAuthLog_sharePassId_fkey" FOREIGN KEY ("sharePassId") REFERENCES "SharePass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLinkDeleteLog" ADD CONSTRAINT "ShareLinkDeleteLog_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
