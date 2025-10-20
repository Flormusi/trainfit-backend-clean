const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestTrainer() {
  try {
    const email = 'test.trainer@trainfit.com';
    const password = 'test123';
    const name = 'Test Trainer';
    
    console.log('🔧 Creando usuario trainer de prueba...');
    
    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('⚠️ El usuario ya existe, actualizando contraseña...');
      
      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Contraseña actualizada');
    } else {
      // Crear nuevo usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'TRAINER',
          status: 'active',
          hasCompletedOnboarding: true
        }
      });
      
      console.log('✅ Usuario trainer creado exitosamente');
      console.log('ID:', user.id);
    }
    
    console.log('\n📋 Credenciales de prueba:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTrainer();