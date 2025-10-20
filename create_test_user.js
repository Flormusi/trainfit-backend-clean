const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creando usuario de prueba...');
    
    // Crear entrenador de prueba
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const trainer = await prisma.user.upsert({
      where: { email: 'test.trainer@trainfit.com' },
      update: {},
      create: {
        name: 'Entrenador Test',
        email: 'test.trainer@trainfit.com',
        password: hashedPassword,
        role: 'TRAINER',
        hasCompletedOnboarding: true
      }
    });

    console.log('✅ Entrenador creado:', trainer.email);

    // Crear cliente de prueba con perfil completo
    const client = await prisma.user.upsert({
      where: { email: 'test.client@trainfit.com' },
      update: {},
      create: {
        name: 'Cliente Test',
        email: 'test.client@trainfit.com',
        password: hashedPassword,
        role: 'CLIENT',
        hasCompletedOnboarding: true
      }
    });

    console.log('✅ Cliente creado:', client.email);

    // Crear perfil del cliente con los nuevos campos
    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: client.id },
      update: {
        age: 28,
        gender: 'FEMALE',
        fitnessLevel: 'INTERMEDIATE',
        goals: ['Perder peso', 'Tonificar'],
        phone: '+54 9 11 1234-5678',
        weight: 65.5,
        height: 165,
        initialObjective: 'Mejorar condición física general',
        trainingDaysPerWeek: 4,
        medicalConditions: 'Ninguna',
        medications: 'Ninguna',
        injuries: 'Ninguna'
      },
      create: {
        userId: client.id,
        name: client.name,
        age: 28,
        gender: 'FEMALE',
        fitnessLevel: 'INTERMEDIATE',
        goals: ['Perder peso', 'Tonificar'],
        phone: '+54 9 11 1234-5678',
        weight: 65.5,
        height: 165,
        initialObjective: 'Mejorar condición física general',
        trainingDaysPerWeek: 4,
        medicalConditions: 'Ninguna',
        medications: 'Ninguna',
        injuries: 'Ninguna'
      }
    });

    console.log('✅ Perfil del cliente creado con nuevos campos');

    // Crear relación entrenador-cliente
    const trainerClient = await prisma.trainerClient.upsert({
      where: {
        trainerId_clientId: {
          trainerId: trainer.id,
          clientId: client.id
        }
      },
      update: {},
      create: {
        trainerId: trainer.id,
        clientId: client.id
      }
    });

    console.log('✅ Relación entrenador-cliente creada');

    console.log('\n🎯 Credenciales para pruebas:');
    console.log('Entrenador:');
    console.log('  Email: test.trainer@trainfit.com');
    console.log('  Password: test123');
    console.log('\nCliente:');
    console.log('  Email: test.client@trainfit.com');
    console.log('  Password: test123');
    console.log('  ID:', client.id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();