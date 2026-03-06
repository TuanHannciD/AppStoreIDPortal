-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "rateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rateWindowSec" INTEGER NOT NULL DEFAULT 60,
    "rateMaxRequests" INTEGER NOT NULL DEFAULT 30,
    "passQuotaTotal" INTEGER NOT NULL DEFAULT 50,
    "consumeOnVerify" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePass" (
    "id" TEXT NOT NULL,
    "sharePageId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "quotaTotal" INTEGER NOT NULL,
    "quotaUsed" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareAuthLog" (
    "id" TEXT NOT NULL,
    "sharePageId" TEXT NOT NULL,
    "sharePassId" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareAuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SharePage_code_key" ON "SharePage"("code");

-- CreateIndex
CREATE INDEX "SharePass_sharePageId_idx" ON "SharePass"("sharePageId");

-- CreateIndex
CREATE INDEX "SharePass_revokedAt_idx" ON "SharePass"("revokedAt");

-- CreateIndex
CREATE INDEX "ShareAuthLog_sharePageId_createdAt_idx" ON "ShareAuthLog"("sharePageId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAuthLog_sharePassId_createdAt_idx" ON "ShareAuthLog"("sharePassId", "createdAt");

-- AddForeignKey
ALTER TABLE "SharePage" ADD CONSTRAINT "SharePage_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePass" ADD CONSTRAINT "SharePass_sharePageId_fkey" FOREIGN KEY ("sharePageId") REFERENCES "SharePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAuthLog" ADD CONSTRAINT "ShareAuthLog_sharePageId_fkey" FOREIGN KEY ("sharePageId") REFERENCES "SharePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAuthLog" ADD CONSTRAINT "ShareAuthLog_sharePassId_fkey" FOREIGN KEY ("sharePassId") REFERENCES "SharePass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
