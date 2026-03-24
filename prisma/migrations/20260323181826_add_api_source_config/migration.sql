-- AlterTable
ALTER TABLE "AppAccount" ADD COLUMN     "apiSourceConfigId" TEXT,
ADD COLUMN     "externalKey" TEXT,
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ApiSourceConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiSourceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiSourceConfig_isActive_idx" ON "ApiSourceConfig"("isActive");

-- CreateIndex
CREATE INDEX "AppAccount_apiSourceConfigId_idx" ON "AppAccount"("apiSourceConfigId");

-- CreateIndex
CREATE INDEX "AppAccount_lastSyncedAt_idx" ON "AppAccount"("lastSyncedAt");

-- AddForeignKey
ALTER TABLE "AppAccount" ADD CONSTRAINT "AppAccount_apiSourceConfigId_fkey" FOREIGN KEY ("apiSourceConfigId") REFERENCES "ApiSourceConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
