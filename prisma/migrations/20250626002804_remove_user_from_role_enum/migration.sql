/*
  Warnings:

  - The values [USER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bodyFat` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `membershipTier` on the `ClientProfile` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TRAINER', 'CLIENT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;

-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "bodyFat",
DROP COLUMN "height",
DROP COLUMN "membershipTier",
ADD COLUMN     "initialObjective" TEXT NOT NULL DEFAULT 'Sin definir',
ADD COLUMN     "trainingDaysPerWeek" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
