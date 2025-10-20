const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'magagroca@gmail.com';
    const newPassword = 'magaroca';

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('Usuario no encontrado:', email);
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed }
    });

    console.log('Contraseña actualizada para:', updated.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();