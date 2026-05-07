-- CreateTable
CREATE TABLE "PkInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "modeConfig" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "matchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "respondedAt" DATETIME,
    CONSTRAINT "PkInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PkInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PkMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "theme" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "modeConfig" TEXT NOT NULL,
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "aScore" INTEGER NOT NULL DEFAULT 0,
    "bScore" INTEGER NOT NULL DEFAULT 0,
    "aXpAwarded" INTEGER NOT NULL DEFAULT 0,
    "bXpAwarded" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "endedReason" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "questionsJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PkDailyXp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PkDailyXp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PkInvite_inviteeId_status_idx" ON "PkInvite"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "PkInvite_inviterId_status_idx" ON "PkInvite"("inviterId", "status");

-- CreateIndex
CREATE INDEX "PkMatch_aId_startedAt_idx" ON "PkMatch"("aId", "startedAt");

-- CreateIndex
CREATE INDEX "PkMatch_bId_startedAt_idx" ON "PkMatch"("bId", "startedAt");

-- CreateIndex
CREATE INDEX "PkDailyXp_userId_date_idx" ON "PkDailyXp"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PkDailyXp_userId_date_key" ON "PkDailyXp"("userId", "date");
