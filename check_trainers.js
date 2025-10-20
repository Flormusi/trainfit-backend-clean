const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrainers() {
  try {
    console.log('🔍 Buscando trainers en la base de datos...');
    
    const trainers = await prisma.user.findMany({
      where: {
        role: 'TRAINER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('👨‍💼 Trainers encontrados:', trainers);
    
    if (trainers.length === 0) {
      console.log('⚠️ No se encontraron trainers. Creando uno de prueba...');
      
      const newTrainer = await prisma.user.create({
        data: {
          name: 'Trainer de Prueba',
          email: 'trainer@test.com',
          password: 'hashedpassword123',
          role: 'TRAINER'
        }
      });
      
      console.log('✅ Trainer creado:', newTrainer);
      return newTrainer.id;
    }
    
    return trainers[0].id;
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainers();