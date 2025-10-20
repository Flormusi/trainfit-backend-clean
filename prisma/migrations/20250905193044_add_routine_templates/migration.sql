-- CreateTable
CREATE TABLE "public"."RoutineTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trainingObjective" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "gender" TEXT,
    "duration" TEXT,
    "exercises" JSONB NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineTemplate_trainingObjective_idx" ON "public"."RoutineTemplate"("trainingObjective");

-- CreateIndex
CREATE INDEX "RoutineTemplate_level_idx" ON "public"."RoutineTemplate"("level");

-- CreateIndex
CREATE INDEX "RoutineTemplate_daysPerWeek_idx" ON "public"."RoutineTemplate"("daysPerWeek");

-- CreateIndex
CREATE INDEX "RoutineTemplate_isActive_idx" ON "public"."RoutineTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "public"."RoutineTemplate" ADD CONSTRAINT "RoutineTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
