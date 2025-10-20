const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTrainerClients() {
  try {
    const trainerId = 'cmbh8k2h00000f5z8kprejtsp'; // ID del trainer actual
    
    console.log('🔍 Buscando clientes para el trainer:', trainerId);
    
    // Buscar clientes usando el mismo método que el controlador
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        trainersAsClient: {
          some: {
            trainerId: trainerId
          }
        }
      },
      include: {
        clientProfile: true,
        assignedRoutines: {
          where: {
            trainerId: trainerId
          },
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('\n📊 Resultados:');
    console.log('Total de clientes encontrados:', clients.length);
    
    if (clients.length > 0) {
      clients.forEach((client, index) => {
        console.log(`\n👤 Cliente ${index + 1}:`);
        console.log('  ID:', client.id);
        console.log('  Nombre:', client.name);
        console.log('  Email:', client.email);
        console.log('  Rol:', client.role);
        console.log('  Rutinas asignadas:', client.assignedRoutines.length);
        
        if (client.clientProfile) {
          console.log('  Perfil completo: Sí');
        } else {
          console.log('  Perfil completo: No');
        }
      });
    } else {
      console.log('❌ No se encontraron clientes para este trainer');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainerClients();