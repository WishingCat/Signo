-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamBonusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pctBps" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamBonusEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyStat" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "leaves" INTEGER NOT NULL DEFAULT 0,
    "lessonsCleared" INTEGER NOT NULL DEFAULT 0,
    "dailyQuestClaimedAt" DATETIME,

    PRIMARY KEY ("userId", "date"),
    CONSTRAINT "DailyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DailyStat" ("date", "lessonsCleared", "userId", "xp") SELECT "date", "lessonsCleared", "userId", "xp" FROM "DailyStat";
DROP TABLE "DailyStat";
ALTER TABLE "new_DailyStat" RENAME TO "DailyStat";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "friendCode" TEXT NOT NULL,
    "avatarSeed" TEXT NOT NULL DEFAULT 'default',
    "role" TEXT NOT NULL DEFAULT 'user',
    "tier" INTEGER NOT NULL DEFAULT 1,
    "pkScore" INTEGER NOT NULL DEFAULT 1000,
    "pkWins" INTEGER NOT NULL DEFAULT 0,
    "pkLosses" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "weeklyXp" INTEGER NOT NULL DEFAULT 0,
    "leaves" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastClearDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarSeed", "bestStreak", "createdAt", "currentStreak", "friendCode", "id", "lastClearDate", "nickname", "passwordHash", "pkLosses", "pkScore", "pkWins", "role", "tier", "totalXp", "username", "weeklyXp") SELECT "avatarSeed", "bestStreak", "createdAt", "currentStreak", "friendCode", "id", "lastClearDate", "nickname", "passwordHash", "pkLosses", "pkScore", "pkWins", "role", "tier", "totalXp", "username", "weeklyXp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_friendCode_key" ON "User"("friendCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "TeamInvite_inviteeId_status_idx" ON "TeamInvite"("inviteeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_teamId_inviteeId_key" ON "TeamInvite"("teamId", "inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamBonusEvent_teamId_date_key" ON "TeamBonusEvent"("teamId", "date");
