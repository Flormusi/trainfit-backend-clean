const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRoutineExercises() {
  try {
    console.log('🔍 Verificando ejercicios de la rutina "Rutina Agosto (Dia 1)"...');
    
    // Buscar la rutina y sus ejercicios
    const routine = await prisma.routine.findFirst({
      where: {
        name: {
          contains: 'Rutina Agosto (Dia 1)',
          mode: 'insensitive'
        }
      },
      include: {
        client: true,
        trainer: true
      }
    });
    
    if (!routine) {
      console.log('❌ Rutina no encontrada');
      return;
    }
    
    console.log('✅ Rutina encontrada:');
    console.log(`   - ID: ${routine.id}`);
    console.log(`   - Nombre: ${routine.name}`);
    console.log(`   - Cliente: ${routine.client.email}`);
    console.log(`   - Entrenador: ${routine.trainer.email}`);
    
    // Verificar los ejercicios
    if (routine.exercises) {
      console.log('\n📋 Ejercicios de la rutina:');
      
      let exercises;
      try {
        exercises = typeof routine.exercises === 'string' 
          ? JSON.parse(routine.exercises) 
          : routine.exercises;
      } catch (error) {
        console.log('❌ Error parseando ejercicios:', error.message);
        console.log('   Contenido raw:', routine.exercises);
        return;
      }
      
      if (Array.isArray(exercises)) {
        exercises.forEach((exercise, index) => {
          console.log(`\n   ${index + 1}. ${exercise.name || 'Sin nombre'}`);
          console.log(`      - Series: ${exercise.sets || 'No definido'}`);
          console.log(`      - Repeticiones: ${exercise.reps || 'No definido'}`);
          console.log(`      - Peso: ${exercise.weight || 'No definido'}`);
          console.log(`      - Descanso: ${exercise.rest || 'No definido'}`);
          console.log(`      - Notas: ${exercise.notes || 'Sin notas'}`);
        });
        
        console.log(`\n✅ Total de ejercicios: ${exercises.length}`);
        
        // Verificar si todos los ejercicios tienen valores completos
        const incompleteExercises = exercises.filter(ex => 
          !ex.sets || !ex.reps || (!ex.weight && ex.weight !== 0)
        );
        
        if (incompleteExercises.length > 0) {
          console.log(`\n⚠️  Ejercicios con datos incompletos: ${incompleteExercises.length}`);
          incompleteExercises.forEach((ex, index) => {
            console.log(`   ${index + 1}. ${ex.name}:`);
            if (!ex.sets) console.log('      - Falta: Series');
            if (!ex.reps) console.log('      - Falta: Repeticiones');
            if (!ex.weight && ex.weight !== 0) console.log('      - Falta: Peso');
          });
        } else {
          console.log('\n✅ Todos los ejercicios tienen datos completos');
        }
        
      } else {
        console.log('❌ Los ejercicios no están en formato de array');
        console.log('   Tipo:', typeof exercises);
        console.log('   Contenido:', exercises);
      }
    } else {
      console.log('❌ La rutina no tiene ejercicios definidos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando ejercicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoutineExercises();