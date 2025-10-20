const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientRoutinesDirectly() {
  try {
    console.log('🔍 Buscando cliente por email...');
    
    // Buscar cliente por email
    const client = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      },
      include: {
        routineAssignmentsAsClient: {
          include: {
            routine: true
          }
        }
      }
    });
    
    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }
    
    console.log('✅ Cliente encontrado:', client.email);
    console.log('📊 Rutinas asignadas:', client.routineAssignmentsAsClient.length);
    
    if (client.routineAssignmentsAsClient.length > 0) {
      console.log('\n📋 Detalles de rutinas asignadas:');
      client.routineAssignmentsAsClient.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.routine.name}`);
        console.log(`   - ID: ${assignment.routine.id}`);
        console.log(`   - Descripción: ${assignment.routine.description || 'Sin descripción'}`);
        console.log(`   - Ejercicios: ${assignment.routine.exercises ? JSON.parse(assignment.routine.exercises).length : 0}`);
        console.log(`   - Fecha asignación: ${assignment.assignedAt}`);
        
        if (assignment.routine.exercises) {
          console.log('   - Lista de ejercicios:');
          const exercises = JSON.parse(assignment.routine.exercises);
          exercises.forEach((exercise, exIndex) => {
            console.log(`     ${exIndex + 1}. ${exercise.name}`);
            console.log(`        Series: ${exercise.sets}`);
            console.log(`        Repeticiones: ${exercise.reps}`);
            console.log(`        Peso: ${exercise.weight || 'No especificado'}`);
          });
        }
      });
    } else {
      console.log('✅ Confirmado: No hay rutinas asignadas al cliente');
    }
    
  } catch (error) {
    console.error('❌ Error consultando la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientRoutinesDirectly();