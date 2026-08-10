/*
  Warnings:

  - You are about to drop the `Avatar` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Avatar" DROP CONSTRAINT "Avatar_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletVerifiedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Avatar";

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");
