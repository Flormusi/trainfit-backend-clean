const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'magagroca@gmail.com' }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Rol:', user.role);
      console.log('Nombre:', user.name);
      console.log('Onboarding completado:', user.hasCompletedOnboarding);
    } else {
      console.log('❌ Usuario no encontrado con email: magagroca@gmail.com');
      console.log('\n📋 Usuarios disponibles:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
      });
      allUsers.forEach(u => console.log(`- ${u.email} (${u.role}) - ${u.name}`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();