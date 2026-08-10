-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "gameMode" TEXT NOT NULL DEFAULT 'ALL_TIME';

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN     "gameMode" TEXT NOT NULL DEFAULT 'ALL_TIME';

-- CreateTable
CREATE TABLE "ModeRating" (
    "userId" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL,
    "mmr" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeRating_pkey" PRIMARY KEY ("userId","gameMode")
);

-- CreateIndex
CREATE INDEX "ModeRating_gameMode_mmr_idx" ON "ModeRating"("gameMode", "mmr");

-- AddForeignKey
ALTER TABLE "ModeRating" ADD CONSTRAINT "ModeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
