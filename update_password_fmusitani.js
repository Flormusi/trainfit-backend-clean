const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    const email = 'florenciamusitani@gmail.com';
    const newPassword = 'fmusitani';
    
    console.log(`🔄 Actualizando contraseña para ${email}...`);
    
    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Actualizar en la base de datos
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Contraseña actualizada exitosamente para ${email}`);
    console.log(`Nueva contraseña: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword();