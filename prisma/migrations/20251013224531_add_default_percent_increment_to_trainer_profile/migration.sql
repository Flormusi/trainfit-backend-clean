-- AlterTable
ALTER TABLE "public"."Exercise" ADD COLUMN     "objectives" TEXT[];

-- AlterTable
ALTER TABLE "public"."TrainerProfile" ADD COLUMN     "defaultPercentIncrement" DOUBLE PRECISION DEFAULT 7.5;

-- CreateTable
CREATE TABLE "public"."CalendarIntegration" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarIntegration_clientId_idx" ON "public"."CalendarIntegration"("clientId");

-- CreateIndex
CREATE INDEX "CalendarIntegration_isActive_idx" ON "public"."CalendarIntegration"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_clientId_provider_key" ON "public"."CalendarIntegration"("clientId", "provider");

-- AddForeignKey
ALTER TABLE "public"."CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
