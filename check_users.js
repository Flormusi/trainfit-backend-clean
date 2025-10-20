const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de usuarios encontrados: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('💡 Necesitas crear un usuario para poder hacer login');
    } else {
      console.log('\n👥 Usuarios disponibles:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   - Rol: ${user.role}`);
        console.log(`   - Onboarding completado: ${user.hasCompletedOnboarding}`);
        console.log(`   - Creado: ${user.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();