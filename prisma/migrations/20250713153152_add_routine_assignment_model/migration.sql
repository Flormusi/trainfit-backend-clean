-- CreateTable
CREATE TABLE "RoutineAssignment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoutineAssignment" ADD CONSTRAINT "RoutineAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineAssignment" ADD CONSTRAINT "RoutineAssignment_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineAssignment" ADD CONSTRAINT "RoutineAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
