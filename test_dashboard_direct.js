const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  try {
    const trainerId = 'cmbh8k2h00000f5z8kprejtsp'; // Maga's ID
    
    console.log('🔍 Probando el conteo de clientes activos...');
    
    // Simular la lógica del controlador corregido
    const activeClientsCount = await prisma.user.count({
      where: {
        role: 'CLIENT',
        routineAssignmentsAsClient: {
          some: {
            trainerId: trainerId,
            isActive: true
          }
        }
      }
    });
    
    console.log(`📊 Clientes activos para el entrenador ${trainerId}: ${activeClientsCount}`);
    
    // Verificar específicamente Flor Musitani
    const florUser = await prisma.user.findFirst({
      where: {
        name: { contains: 'Flor', mode: 'insensitive' }
      },
      include: {
        routineAssignmentsAsClient: {
          where: {
            trainerId: trainerId,
            isActive: true
          }
        }
      }
    });
    
    if (florUser) {
      console.log(`👤 Usuario encontrado: ${florUser.name} (${florUser.email})`);
      console.log(`📋 Asignaciones activas: ${florUser.routineAssignmentsAsClient.length}`);
      florUser.routineAssignmentsAsClient.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Rutina ID: ${assignment.routineId}, Activa: ${assignment.isActive}`);
      });
    } else {
      console.log('❌ No se encontró usuario con nombre Flor');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
