-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastClearDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarSeed", "createdAt", "friendCode", "id", "nickname", "passwordHash", "pkLosses", "pkScore", "pkWins", "role", "tier", "username") SELECT "avatarSeed", "createdAt", "friendCode", "id", "nickname", "passwordHash", "pkLosses", "pkScore", "pkWins", "role", "tier", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_friendCode_key" ON "User"("friendCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
