const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unassignRoutine() {
  try {
    console.log('🔄 Desasignando rutina de agosto del cliente...');
    
    // Buscar el cliente
    const client = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' }
    });
    
    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }
    
    console.log(`📋 Cliente encontrado: ${client.email} (ID: ${client.id})`);
    
    // Eliminar la asignación de rutina
    const routineId = 'cmf0e4byt000of5t14jgq6wqp';
    
    const deletedAssignment = await prisma.routineAssignment.deleteMany({
      where: {
        clientId: client.id,
        routineId: routineId
      }
    });
    
    console.log(`✅ Asignaciones eliminadas: ${deletedAssignment.count}`);
    
    // Verificar rutinas restantes del cliente
    const remainingRoutines = await prisma.routineAssignment.findMany({
      where: { clientId: client.id },
      include: {
        routine: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('📋 Rutinas restantes del cliente:');
    remainingRoutines.forEach(cr => {
      console.log(`- ${cr.routine.name} (ID: ${cr.routine.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error desasignando rutina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unassignRoutine();