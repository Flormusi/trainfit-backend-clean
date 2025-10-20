-- AlterTable
ALTER TABLE "public"."RoutineAssignment" ADD COLUMN     "pyramidalRepsPattern" TEXT,
ADD COLUMN     "pyramidalRepsSequence" JSONB,
ADD COLUMN     "trainingObjectives" JSONB;
