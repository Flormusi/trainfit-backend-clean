const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugClientCount() {
  try {
    console.log('🔍 Depurando conteo de clientes activos...');
    
    const trainerId = '6751b5b8e1b8c8a2f4d3e5f7';
    
    // Verificar clientes con asignaciones
    const clientsWithAssignments = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      include: {
        routineAssignmentsAsClient: {
          where: {
            trainerId: trainerId
          }
        }
      }
    });
    
    console.log('👥 Clientes y sus asignaciones:');
    clientsWithAssignments.forEach(client => {
      console.log(`Cliente: ${client.name} (${client.email})`);
      console.log(`Asignaciones: ${client.routineAssignmentsAsClient.length}`);
      if (client.routineAssignmentsAsClient.length > 0) {
        client.routineAssignmentsAsClient.forEach(assignment => {
          console.log(`  - Rutina ID: ${assignment.routineId}, Trainer ID: ${assignment.trainerId}`);
        });
      }
      console.log('---');
    });
    
    // Contar usando routineAssignmentsAsClient (correcto)
    const clientCountWithAssignments = await prisma.user.count({
      where: {
        role: 'CLIENT',
        routineAssignmentsAsClient: { some: { trainerId: trainerId } }
      }
    });
    
    console.log('📊 Conteo usando routineAssignmentsAsClient:', clientCountWithAssignments);
    
    // Verificar si existe la relación assignedRoutines
    try {
      const clientCountWithAssignedRoutines = await prisma.user.count({
        where: {
          role: 'CLIENT',
          assignedRoutines: { some: { trainerId: trainerId } }
        }
      });
      console.log('📊 Conteo usando assignedRoutines:', clientCountWithAssignedRoutines);
    } catch (error) {
      console.log('❌ La relación assignedRoutines no existe:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClientCount();