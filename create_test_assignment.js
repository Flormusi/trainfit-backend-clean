const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAssignment() {
  try {
    const trainerId = 'cmbh8k2h00000f5z8kprejtsp'; // Maga's ID
    
    // Buscar Flor Musitani
    const florUser = await prisma.user.findFirst({
      where: {
        name: { contains: 'Flor', mode: 'insensitive' }
      }
    });
    
    if (!florUser) {
      console.log('❌ No se encontró usuario Flor');
      return;
    }
    
    console.log(`👤 Usuario encontrado: ${florUser.name} (${florUser.email})`);
    
    // Buscar una rutina existente
    const routine = await prisma.routine.findFirst({
      select: { id: true, name: true }
    });
    
    if (!routine) {
      console.log('❌ No se encontró ninguna rutina');
      return;
    }
    
    console.log(`🏋️ Rutina encontrada: ${routine.name} (${routine.id})`);
    
    // Crear asignación de rutina
    const assignment = await prisma.routineAssignment.create({
      data: {
        clientId: florUser.id,
        routineId: routine.id,
        trainerId: trainerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        trainingObjectives: ["strength", "hypertrophy"]
      }
    });
    
    console.log('✅ Asignación creada exitosamente:');
    console.log(`   ID: ${assignment.id}`);
    console.log(`   Cliente: ${florUser.name}`);
    console.log(`   Rutina: ${routine.name}`);
    console.log(`   Entrenador: ${trainerId}`);
    console.log(`   Fecha inicio: ${assignment.startDate}`);
    console.log(`   Fecha fin: ${assignment.endDate}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAssignment();
