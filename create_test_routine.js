const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestRoutine() {
  try {
    console.log('🏋️ Creando rutina de prueba con ejercicios que tienen video...');
    
    // Buscar los ejercicios con videoUrl que creamos
    const exercisesWithVideo = await prisma.exercise.findMany({
      where: {
        videoUrl: {
          not: null
        }
      }
    });
    
    console.log('📹 Ejercicios con video encontrados:', exercisesWithVideo.length);
    
    if (exercisesWithVideo.length === 0) {
      console.log('❌ No se encontraron ejercicios con video');
      return;
    }
    
    // Buscar un trainer válido
    const trainer = await prisma.user.findFirst({
      where: {
        role: 'TRAINER'
      }
    });
    
    if (!trainer) {
      console.log('❌ No se encontró un trainer válido');
      return;
    }
    
    // Buscar un cliente válido
    const client = await prisma.user.findFirst({
      where: {
        role: 'CLIENT'
      }
    });
    
    if (!client) {
      console.log('❌ No se encontró un cliente válido');
      return;
    }
    
    // Crear la rutina con los ejercicios que tienen video
    const routineExercises = exercisesWithVideo.map((exercise, index) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      series: '3',
      reps: '12',
      weight: 'Peso corporal',
      notes: `Ejercicio ${index + 1} con video tutorial`,
      day: 1,
      image_url: exercise.imageUrl,
      videoUrl: exercise.videoUrl
    }));
    
    const testRoutine = await prisma.routine.create({
      data: {
        name: 'Rutina de Prueba con Videos',
        description: 'Rutina creada para probar la funcionalidad de enlaces de video',
        duration: '45 minutos',
        trainerId: trainer.id,
        clientId: client.id,
        exercises: routineExercises
      }
    });
    
    console.log('✅ Rutina de prueba creada exitosamente:');
    console.log('   - ID:', testRoutine.id);
    console.log('   - Nombre:', testRoutine.name);
    console.log('   - Trainer:', trainer.name);
    console.log('   - Cliente:', client.name);
    console.log('   - Ejercicios con video:', routineExercises.length);
    
    // Mostrar detalles de los ejercicios
    routineExercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.name} - Video: ${exercise.videoUrl}`);
    });
    
    console.log('\n🎉 ¡Rutina lista para probar! Ve a la sección de rutinas en la aplicación.');
    
  } catch (error) {
    console.error('❌ Error al crear rutina de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRoutine();