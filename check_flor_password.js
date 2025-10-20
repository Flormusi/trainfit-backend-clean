const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkFlorPassword() {
  try {
    console.log('🔍 Verificando contraseña de Flor Musitani...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`👤 Usuario: ${user.name} (${user.email})`);
    console.log(`🔐 Hash de contraseña: ${user.password}`);
    
    // Probar contraseñas específicas
    const testPasswords = [
      'fmisotani',
      'fmusitani', 
      'florencia',
      'musitani',
      'florenciamusitani',
      'flor123',
      'password123',
      'password',
      '123456',
      'admin',
      'test123',
      'trainfit123',
      'Flor123',
      'Florencia123'
    ];

    console.log('🧪 Probando contraseñas...');
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Contraseña correcta encontrada: "${testPassword}"`);
          return testPassword;
        } else {
          console.log(`❌ "${testPassword}" - No coincide`);
        }
      } catch (error) {
        console.log(`❌ Error probando contraseña "${testPassword}":`, error.message);
      }
    }
    
    console.log('❌ No se encontró la contraseña correcta');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFlorPassword();