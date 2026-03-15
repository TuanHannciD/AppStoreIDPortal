-- AlterTable
ALTER TABLE "SharePage" ALTER COLUMN "consumeOnVerify" SET DEFAULT false;

-- AlterTable
ALTER TABLE "SharePass" ADD COLUMN     "lastRevealedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppAccount" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT,
    "twoFaKey" TEXT,
    "backupCode" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePageAccount" (
    "id" TEXT NOT NULL,
    "sharePageId" TEXT NOT NULL,
    "appAccountId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharePageAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePassVerification" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sharePageId" TEXT NOT NULL,
    "sharePassId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharePassVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppAccount_appId_idx" ON "AppAccount"("appId");

-- CreateIndex
CREATE INDEX "AppAccount_isActive_idx" ON "AppAccount"("isActive");

-- CreateIndex
CREATE INDEX "SharePageAccount_sharePageId_idx" ON "SharePageAccount"("sharePageId");

-- CreateIndex
CREATE INDEX "SharePageAccount_appAccountId_idx" ON "SharePageAccount"("appAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SharePageAccount_sharePageId_appAccountId_key" ON "SharePageAccount"("sharePageId", "appAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SharePassVerification_token_key" ON "SharePassVerification"("token");

-- CreateIndex
CREATE INDEX "SharePassVerification_token_idx" ON "SharePassVerification"("token");

-- CreateIndex
CREATE INDEX "SharePassVerification_sharePageId_idx" ON "SharePassVerification"("sharePageId");

-- CreateIndex
CREATE INDEX "SharePassVerification_sharePassId_idx" ON "SharePassVerification"("sharePassId");

-- CreateIndex
CREATE INDEX "SharePassVerification_expiresAt_idx" ON "SharePassVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "SharePage" ADD CONSTRAINT "SharePage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAccount" ADD CONSTRAINT "AppAccount_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePageAccount" ADD CONSTRAINT "SharePageAccount_sharePageId_fkey" FOREIGN KEY ("sharePageId") REFERENCES "SharePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePageAccount" ADD CONSTRAINT "SharePageAccount_appAccountId_fkey" FOREIGN KEY ("appAccountId") REFERENCES "AppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePassVerification" ADD CONSTRAINT "SharePassVerification_sharePageId_fkey" FOREIGN KEY ("sharePageId") REFERENCES "SharePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharePassVerification" ADD CONSTRAINT "SharePassVerification_sharePassId_fkey" FOREIGN KEY ("sharePassId") REFERENCES "SharePass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
