const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRoutineSets() {
  try {
    console.log('🔧 Corrigiendo series faltantes en "Rutina Agosto (Dia 1)"...');
    
    // Buscar la rutina
    const routine = await prisma.routine.findFirst({
      where: {
        name: {
          contains: 'Rutina Agosto (Dia 1)',
          mode: 'insensitive'
        }
      }
    });
    
    if (!routine) {
      console.log('❌ Rutina no encontrada');
      return;
    }
    
    console.log('✅ Rutina encontrada:', routine.name);
    
    // Obtener ejercicios actuales
    let exercises;
    try {
      exercises = typeof routine.exercises === 'string' 
        ? JSON.parse(routine.exercises) 
        : routine.exercises;
    } catch (error) {
      console.log('❌ Error parseando ejercicios:', error.message);
      return;
    }
    
    if (!Array.isArray(exercises)) {
      console.log('❌ Los ejercicios no están en formato de array');
      return;
    }
    
    console.log(`📋 Procesando ${exercises.length} ejercicios...`);
    
    // Agregar series a cada ejercicio que no las tenga
    const updatedExercises = exercises.map((exercise, index) => {
      const updatedExercise = { ...exercise };
      
      // Si no tiene series definidas, agregar un valor por defecto
      if (!updatedExercise.sets) {
        // Asignar series basado en el tipo de ejercicio
        if (exercise.name && exercise.name.toLowerCase().includes('plancha')) {
          updatedExercise.sets = '3'; // Para ejercicios isométricos
        } else if (exercise.name && exercise.name.toLowerCase().includes('movilidad')) {
          updatedExercise.sets = '2'; // Para ejercicios de movilidad
        } else {
          updatedExercise.sets = '3'; // Para ejercicios de fuerza en general
        }
        
        console.log(`   ✅ ${index + 1}. ${exercise.name}: Agregadas ${updatedExercise.sets} series`);
      } else {
        console.log(`   ✓ ${index + 1}. ${exercise.name}: Ya tiene ${updatedExercise.sets} series`);
      }
      
      // Agregar descanso si no lo tiene
      if (!updatedExercise.rest) {
        if (exercise.name && exercise.name.toLowerCase().includes('plancha')) {
          updatedExercise.rest = '30 seg'; // Para ejercicios isométricos
        } else if (exercise.name && exercise.name.toLowerCase().includes('movilidad')) {
          updatedExercise.rest = '30 seg'; // Para ejercicios de movilidad
        } else {
          updatedExercise.rest = '60 seg'; // Para ejercicios de fuerza
        }
      }
      
      // Asegurar que el peso esté definido para ejercicios que no sean de peso corporal
      if (!updatedExercise.weight && updatedExercise.weight !== 0) {
        if (exercise.name && (exercise.name.toLowerCase().includes('plancha') || exercise.name.toLowerCase().includes('movilidad'))) {
          updatedExercise.weight = 'Peso corporal';
        }
      }
      
      return updatedExercise;
    });
    
    // Actualizar la rutina en la base de datos
    console.log('\n💾 Actualizando rutina en la base de datos...');
    
    const updatedRoutine = await prisma.routine.update({
      where: {
        id: routine.id
      },
      data: {
        exercises: JSON.stringify(updatedExercises)
      }
    });
    
    console.log('✅ Rutina actualizada exitosamente!');
    
    // Verificar la actualización
    console.log('\n🔍 Verificación final:');
    updatedExercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.name}`);
      console.log(`      - Series: ${exercise.sets}`);
      console.log(`      - Repeticiones: ${exercise.reps}`);
      console.log(`      - Peso: ${exercise.weight}`);
      console.log(`      - Descanso: ${exercise.rest}`);
    });
    
    console.log('\n🎉 ¡Todos los ejercicios ahora tienen datos completos!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo series:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoutineSets();