-- AlterTable
ALTER TABLE "ApiSourceConfig" ADD COLUMN     "cronEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cronIntervalHours" INTEGER,
ADD COLUMN     "cronMaxAccountsPerRun" INTEGER,
ADD COLUMN     "cronStatus" TEXT,
ADD COLUMN     "lastCronError" TEXT,
ADD COLUMN     "lastCronFinishedAt" TIMESTAMP(3),
ADD COLUMN     "lastCronStartedAt" TIMESTAMP(3),
ADD COLUMN     "lastCronSummary" TEXT,
ADD COLUMN     "nextCronRunAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ApiSourceConfig_cronEnabled_idx" ON "ApiSourceConfig"("cronEnabled");

-- CreateIndex
CREATE INDEX "ApiSourceConfig_nextCronRunAt_idx" ON "ApiSourceConfig"("nextCronRunAt");
