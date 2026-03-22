CREATE TYPE "SharePageDeleteMode" AS ENUM ('SAFE_DELETE', 'FORCE_DELETE');
CREATE TYPE "SharePageDeleteStatus" AS ENUM ('BLOCKED', 'DELETED', 'FAILED');

CREATE TABLE "SharePageDeleteLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "sharePageId" TEXT NOT NULL,
    "sharePageCode" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "mode" "SharePageDeleteMode" NOT NULL,
    "status" "SharePageDeleteStatus" NOT NULL,
    "reason" TEXT,
    "dependencySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharePageDeleteLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SharePageDeleteLog_sharePageId_createdAt_idx" ON "SharePageDeleteLog"("sharePageId", "createdAt");
CREATE INDEX "SharePageDeleteLog_actorUserId_createdAt_idx" ON "SharePageDeleteLog"("actorUserId", "createdAt");
CREATE INDEX "SharePageDeleteLog_status_createdAt_idx" ON "SharePageDeleteLog"("status", "createdAt");