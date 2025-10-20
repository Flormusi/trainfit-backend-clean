-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "membershipTier" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpire" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
