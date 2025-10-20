const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRoutines() {
  try {
    console.log('🔍 Consultando rutinas en la base de datos...');
    
    const routines = await prisma.routine.findMany({
      select: {
        id: true,
        name: true,
        trainerId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Total de rutinas encontradas: ${routines.length}`);
    console.log('\n📋 Lista de rutinas:');
    
    routines.forEach((routine, index) => {
      console.log(`${index + 1}. "${routine.name}"`);
      console.log(`   ID: ${routine.id}`);
      console.log(`   Trainer ID: ${routine.trainerId}`);
      console.log(`   Creada: ${routine.createdAt}`);
      console.log('');
    });
    
    // Buscar específicamente la rutina problemática
    const targetRoutine = routines.find(r => 
      r.name && r.name.includes('Rutina de Prueba - Reenvío Email')
    );
    
    if (targetRoutine) {
      console.log('🎯 ENCONTRADA: La rutina "Rutina de Prueba - Reenvío Email" SÍ existe en la base de datos:');
      console.log(`   ID: ${targetRoutine.id}`);
      console.log(`   Trainer ID: ${targetRoutine.trainerId}`);
    } else {
      console.log('❌ La rutina "Rutina de Prueba - Reenvío Email" NO existe en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error consultando la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoutines();