const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  try {
    const trainerId = 'cmbh8k2h00000f5z8kprejtsp'; // Maga's ID
    
    console.log('🔍 Probando el conteo de clientes activos...');
    
    // Simular la lógica del controlador corregido (sin isActive ya que no existe)
    const activeClientsCount = await prisma.user.count({
      where: {
        role: 'CLIENT',
        routineAssignmentsAsClient: {
          some: {
            trainerId: trainerId
          }
        }
      }
    });
    
    console.log(`📊 Clientes con asignaciones para el entrenador ${trainerId}: ${activeClientsCount}`);
    
    // Verificar específicamente Flor Musitani
    const florUser = await prisma.user.findFirst({
      where: {
        name: { contains: 'Flor', mode: 'insensitive' }
      },
      include: {
        routineAssignmentsAsClient: {
          where: {
            trainerId: trainerId
          }
        }
      }
    });
    
    if (florUser) {
      console.log(`👤 Usuario encontrado: ${florUser.name} (${florUser.email})`);
      console.log(`📋 Asignaciones totales: ${florUser.routineAssignmentsAsClient.length}`);
      florUser.routineAssignmentsAsClient.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Rutina ID: ${assignment.routineId}, Fecha inicio: ${assignment.startDate}, Fecha fin: ${assignment.endDate}`);
      });
    } else {
      console.log('❌ No se encontró usuario con nombre Flor');
    }
    
    // Verificar todos los clientes con asignaciones
    const allClientsWithAssignments = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        routineAssignmentsAsClient: {
          some: {
            trainerId: trainerId
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            routineAssignmentsAsClient: {
              where: {
                trainerId: trainerId
              }
            }
          }
        }
      }
    });
    
    console.log('\n📋 Todos los clientes con asignaciones:');
    allClientsWithAssignments.forEach(client => {
      console.log(`- ${client.name} (${client.email}): ${client._count.routineAssignmentsAsClient} asignaciones`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
