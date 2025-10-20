// Script para agregar ejercicios de prueba con videoUrl
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addVideoExercises() {
  try {
    console.log('🎬 Agregando ejercicios con enlaces de video...');
    
    // Ejercicios de prueba con videoUrl
    const exercisesWithVideo = [
      {
        name: 'Sentadillas con peso corporal',
        description: 'Ejercicio básico de piernas y glúteos',
        type: 'strength',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        muscles: ['legs', 'glutes'],
        imageUrl: 'https://example.com/sentadillas.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
        trainerId: 'cmbh8k2h00000f5z8kprejtsp'
        },
        {
          name: 'Flexiones de pecho',
          description: 'Ejercicio para fortalecer pecho, hombros y tríceps',
          type: 'strength',
          equipment: 'bodyweight',
          difficulty: 'beginner',
          muscles: ['chest', 'shoulders', 'triceps'],
          imageUrl: 'https://example.com/flexiones.jpg',
          videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          trainerId: 'cmbh8k2h00000f5z8kprejtsp'
        },
        {
          name: 'Plancha abdominal',
          description: 'Ejercicio isométrico para fortalecer el core',
          type: 'strength',
          equipment: 'bodyweight',
          difficulty: 'intermediate',
          muscles: ['core', 'abs'],
          imageUrl: 'https://example.com/plancha.jpg',
          videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          trainerId: 'cmbh8k2h00000f5z8kprejtsp'
      }
    ];

    for (const exercise of exercisesWithVideo) {
      const created = await prisma.exercise.create({
        data: exercise
      });
      console.log(`✅ Ejercicio creado: ${created.name} (ID: ${created.id}) con video: ${created.videoUrl}`);
    }

    console.log('🎉 Ejercicios con video agregados exitosamente!');
    
    // Verificar que se crearon correctamente
    const exercisesWithVideoCount = await prisma.exercise.count({
      where: {
        videoUrl: {
          not: null
        }
      }
    });
    
    console.log(`📊 Total de ejercicios con video en la base de datos: ${exercisesWithVideoCount}`);
    
  } catch (error) {
    console.error('❌ Error al agregar ejercicios con video:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVideoExercises();