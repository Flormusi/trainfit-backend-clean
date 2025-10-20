const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClientRoutines() {
  try {
    console.log('🔍 Verificando rutinas del cliente...');
    
    // Buscar el cliente
    const client = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      }
    });
    
    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }
    
    console.log(`📋 Cliente encontrado: ${client.email} (ID: ${client.id})`);
    
    // Verificar asignaciones de rutinas
    const routineAssignments = await prisma.routineAssignment.findMany({
      where: {
        clientId: client.id
      },
      include: {
        routine: true
      }
    });
    
    console.log(`📊 Total de rutinas asignadas: ${routineAssignments.length}`);
    
    if (routineAssignments.length > 0) {
      console.log('\n📋 Rutinas asignadas:');
      routineAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. ${assignment.routine.name} (ID: ${assignment.routine.id})`);
        console.log(`   - Asignada el: ${assignment.assignedDate}`);
        console.log(`   - Fecha inicio: ${assignment.startDate}`);
        console.log(`   - Fecha fin: ${assignment.endDate}`);
      });
    } else {
      console.log('✅ No hay rutinas asignadas al cliente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientRoutines();