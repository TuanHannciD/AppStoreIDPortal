CREATE TYPE "SharePassDeleteMode" AS ENUM ('SAFE_DELETE', 'FORCE_DELETE');
CREATE TYPE "SharePassDeleteStatus" AS ENUM ('BLOCKED', 'DELETED', 'FAILED');

CREATE TABLE "SharePassDeleteLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "sharePassId" TEXT NOT NULL,
    "sharePassLabel" TEXT,
    "sharePageId" TEXT NOT NULL,
    "sharePageCode" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "mode" "SharePassDeleteMode" NOT NULL,
    "status" "SharePassDeleteStatus" NOT NULL,
    "reason" TEXT,
    "dependencySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharePassDeleteLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SharePassDeleteLog_sharePassId_createdAt_idx" ON "SharePassDeleteLog"("sharePassId", "createdAt");
CREATE INDEX "SharePassDeleteLog_actorUserId_createdAt_idx" ON "SharePassDeleteLog"("actorUserId", "createdAt");
CREATE INDEX "SharePassDeleteLog_status_createdAt_idx" ON "SharePassDeleteLog"("status", "createdAt");
