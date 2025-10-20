const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUserCredentials() {
  try {
    console.log('🔍 Buscando usuario florenciamusitani@gmail.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Role:', user.role);
      console.log('  - Password hash:', user.password.substring(0, 20) + '...');
      
      // Probar diferentes contraseñas comunes
      const commonPasswords = ['password123', '123456', 'florencia123', 'admin123', 'test123'];
      
      console.log('\n🔐 Probando contraseñas comunes...');
      for (const password of commonPasswords) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`  - ${password}: ${isMatch ? '✅ CORRECTA' : '❌ incorrecta'}`);
        if (isMatch) {
          console.log(`\n🎉 Contraseña encontrada: ${password}`);
          break;
        }
      }
    } else {
      console.log('❌ Usuario no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCredentials();