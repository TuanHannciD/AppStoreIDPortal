-- CreateEnum
CREATE TYPE "AppDeleteMode" AS ENUM ('SAFE_DELETE', 'FORCE_DELETE');

-- CreateEnum
CREATE TYPE "AppDeleteStatus" AS ENUM ('BLOCKED', 'DELETED', 'FAILED');

-- CreateTable
CREATE TABLE "AppDeleteLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL,
    "mode" "AppDeleteMode" NOT NULL,
    "status" "AppDeleteStatus" NOT NULL,
    "reason" TEXT,
    "dependencySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppDeleteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppDeleteLog_appId_createdAt_idx" ON "AppDeleteLog"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "AppDeleteLog_actorUserId_createdAt_idx" ON "AppDeleteLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AppDeleteLog_status_createdAt_idx" ON "AppDeleteLog"("status", "createdAt");
