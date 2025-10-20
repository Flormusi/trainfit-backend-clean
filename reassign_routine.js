const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignRoutine() {
  try {
    console.log('🔄 Reasignando rutina de agosto al cliente...');
    
    // Buscar el cliente
    const client = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' }
    });
    
    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }
    
    console.log(`📋 Cliente encontrado: ${client.email} (ID: ${client.id})`);
    
    // Crear nueva asignación de rutina
    const routineId = 'cmf0e4byt000of5t14jgq6wqp';
    const trainerId = 'cmbh8k2h00000f5z8kprejtsp';
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mes de duración
    
    const newAssignment = await prisma.routineAssignment.create({
      data: {
        clientId: client.id,
        routineId: routineId,
        trainerId: trainerId,
        startDate: startDate,
        endDate: endDate
      }
    });
    
    console.log(`✅ Rutina reasignada exitosamente:`);
    console.log(`- Assignment ID: ${newAssignment.id}`);
    console.log(`- Cliente: ${client.email}`);
    console.log(`- Rutina ID: ${routineId}`);
    
    // Verificar rutinas del cliente
    const clientRoutines = await prisma.routineAssignment.findMany({
      where: { clientId: client.id },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            exercises: true
          }
        }
      }
    });
    
    console.log('📋 Rutinas actuales del cliente:');
    clientRoutines.forEach(cr => {
      console.log(`- ${cr.routine.name} (ID: ${cr.routine.id})`);
      if (cr.routine.exercises) {
        const exercises = JSON.parse(cr.routine.exercises);
        console.log(`  Ejercicios: ${exercises.length}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error reasignando rutina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reassignRoutine();