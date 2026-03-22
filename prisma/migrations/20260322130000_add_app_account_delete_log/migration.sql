CREATE TYPE "AppAccountDeleteMode" AS ENUM ('SAFE_DELETE', 'FORCE_DELETE');
CREATE TYPE "AppAccountDeleteStatus" AS ENUM ('BLOCKED', 'DELETED', 'FAILED');

CREATE TABLE "AppAccountDeleteLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "appAccountId" TEXT NOT NULL,
    "appAccountTitle" TEXT,
    "appAccountEmail" TEXT,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "mode" "AppAccountDeleteMode" NOT NULL,
    "status" "AppAccountDeleteStatus" NOT NULL,
    "reason" TEXT,
    "dependencySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppAccountDeleteLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppAccountDeleteLog_appAccountId_createdAt_idx" ON "AppAccountDeleteLog"("appAccountId", "createdAt");
CREATE INDEX "AppAccountDeleteLog_actorUserId_createdAt_idx" ON "AppAccountDeleteLog"("actorUserId", "createdAt");
CREATE INDEX "AppAccountDeleteLog_status_createdAt_idx" ON "AppAccountDeleteLog"("status", "createdAt");
