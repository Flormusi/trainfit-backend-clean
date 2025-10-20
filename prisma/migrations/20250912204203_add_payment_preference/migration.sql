-- CreateTable
CREATE TABLE "public"."PaymentPreference" (
    "id" TEXT NOT NULL,
    "preferenceId" TEXT,
    "trainerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPreference_preferenceId_key" ON "public"."PaymentPreference"("preferenceId");

-- AddForeignKey
ALTER TABLE "public"."PaymentPreference" ADD CONSTRAINT "PaymentPreference_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentPreference" ADD CONSTRAINT "PaymentPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
