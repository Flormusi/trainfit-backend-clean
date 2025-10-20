const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`\n📊 Total de usuarios: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Lista de usuarios:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   - Rol: ${user.role}`);
        console.log(`   - Estado: ${user.status}`);
        console.log(`   - Creado: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      // Buscar específicamente el usuario trainer
      const trainers = users.filter(user => user.role === 'TRAINER');
      console.log(`\n🏋️ Entrenadores encontrados: ${trainers.length}`);
      
      if (trainers.length > 0) {
        console.log('Emails de entrenadores:');
        trainers.forEach(trainer => {
          console.log(`- ${trainer.email}`);
        });
      }
    } else {
      console.log('❌ No se encontraron usuarios en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();