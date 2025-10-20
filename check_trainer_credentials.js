const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkTrainerCredentials() {
  try {
    const trainer = await prisma.user.findFirst({
      where: {
        email: 'magagroca@gmail.com',
        role: 'TRAINER'
      }
    });
    
    if (!trainer) {
      console.log('❌ Entrenador no encontrado');
      return;
    }
    
    console.log('✅ Entrenador encontrado:', trainer.name);
    console.log('📧 Email:', trainer.email);
    console.log('🔑 Password hash:', trainer.password);
    
    // Probar contraseñas comunes
    const possiblePasswords = ['password123', 'trainer123', 'test123', '123456', 'maga123', 'Maga123', 'magagroca', 'maga', 'Maga', 'password', 'admin123', 'admin'];
    
    for (const password of possiblePasswords) {
      const isValid = await bcrypt.compare(password, trainer.password);
      console.log(`🔍 Probando "${password}":`, isValid ? '✅ VÁLIDA' : '❌ Inválida');
      if (isValid) {
        console.log(`🎉 Contraseña correcta encontrada: "${password}"`);
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainerCredentials();