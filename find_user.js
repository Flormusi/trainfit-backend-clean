const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' },
      include: { clientProfile: true }
    });
    console.log('Usuario encontrado:', user);
  } catch (error) {
    console.error('Error al buscar usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUser();