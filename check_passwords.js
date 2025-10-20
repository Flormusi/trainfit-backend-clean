const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    console.log('🔍 Verificando contraseñas de usuarios...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });

    console.log('🧪 Probando contraseñas comunes...');
    const commonPasswords = ['password123', 'password', '123456', 'admin', 'test123'];

    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.name} (${user.email})`);
      
      for (const testPassword of commonPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, user.password);
          if (isMatch) {
            console.log(`✅ Contraseña encontrada: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error probando contraseña "${testPassword}":`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();