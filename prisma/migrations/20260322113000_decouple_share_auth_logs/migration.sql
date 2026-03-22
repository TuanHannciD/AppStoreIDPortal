ALTER TABLE "ShareAuthLog"
ADD COLUMN "sharePageCode" TEXT,
ADD COLUMN "sharePassLabel" TEXT,
ADD COLUMN "appId" TEXT,
ADD COLUMN "appName" TEXT;

UPDATE "ShareAuthLog" AS log
SET
  "sharePageCode" = page."code",
  "appId" = page."appId",
  "appName" = app."name"
FROM "SharePage" AS page
LEFT JOIN "App" AS app ON app."id" = page."appId"
WHERE page."id" = log."sharePageId";

UPDATE "ShareAuthLog" AS log
SET "sharePassLabel" = pass."label"
FROM "SharePass" AS pass
WHERE pass."id" = log."sharePassId";

ALTER TABLE "ShareAuthLog" DROP CONSTRAINT IF EXISTS "ShareAuthLog_sharePageId_fkey";
ALTER TABLE "ShareAuthLog" DROP CONSTRAINT IF EXISTS "ShareAuthLog_sharePassId_fkey";

ALTER TABLE "ShareAuthLog"
ALTER COLUMN "sharePageId" DROP NOT NULL;

CREATE INDEX "ShareAuthLog_appId_createdAt_idx"
ON "ShareAuthLog"("appId", "createdAt");

CREATE INDEX "ShareAuthLog_action_createdAt_idx"
ON "ShareAuthLog"("action", "createdAt");
