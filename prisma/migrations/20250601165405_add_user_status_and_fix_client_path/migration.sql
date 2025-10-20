/*
  Warnings:

  - You are about to drop the column `clientId` on the `Progress` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Progress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_clientId_fkey";

-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "clientId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" TEXT DEFAULT 'active';

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
