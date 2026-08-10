-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "gameMode" TEXT,
ADD COLUMN     "prizeDescription" TEXT,
ADD COLUMN     "signupsEnabled" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "startsAt" DROP NOT NULL;
