const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugRoutineStructure() {
  try {
    console.log('🔍 Analizando estructura de rutinas y asignaciones...');
    
    // 1. Obtener todas las rutinas
    console.log('\n📋 === RUTINAS ===');
    const routines = await prisma.routine.findMany({
      select: {
        id: true,
        name: true,
        trainerId: true,
        clientId: true,
        createdAt: true
      }
    });
    
    console.log(`Total de rutinas: ${routines.length}`);
    routines.forEach((routine, index) => {
      console.log(`${index + 1}. ${routine.name}`);
      console.log(`   ID: ${routine.id}`);
      console.log(`   Trainer ID: ${routine.trainerId}`);
      console.log(`   Client ID: ${routine.clientId || 'NULL/EMPTY'}`);
      console.log(`   Creada: ${routine.createdAt}`);
      console.log('');
    });
    
    // 2. Obtener todas las asignaciones de rutinas
    console.log('\n🎯 === ASIGNACIONES DE RUTINAS ===');
    const assignments = await prisma.routineAssignment.findMany({
      select: {
        id: true,
        routineId: true,
        clientId: true,
        trainerId: true,
        startDate: true,
        endDate: true,
        createdAt: true
      }
    });
    
    console.log(`Total de asignaciones: ${assignments.length}`);
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. Asignación ID: ${assignment.id}`);
      console.log(`   Routine ID: ${assignment.routineId}`);
      console.log(`   Client ID: ${assignment.clientId}`);
      console.log(`   Trainer ID: ${assignment.trainerId}`);
      console.log(`   Inicio: ${assignment.startDate}`);
      console.log(`   Fin: ${assignment.endDate}`);
      console.log(`   Creada: ${assignment.createdAt}`);
      console.log('');
    });
    
    // 3. Obtener relaciones entrenador-cliente
    console.log('\n👥 === RELACIONES ENTRENADOR-CLIENTE ===');
    const trainerClients = await prisma.trainerClient.findMany({
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`Total de relaciones: ${trainerClients.length}`);
    trainerClients.forEach((relation, index) => {
      console.log(`${index + 1}. Relación:`);
      console.log(`   Entrenador: ${relation.trainer.name} (${relation.trainer.email})`);
      console.log(`   Cliente: ${relation.client.name} (${relation.client.email})`);
      console.log(`   Trainer ID: ${relation.trainerId}`);
      console.log(`   Client ID: ${relation.clientId}`);
      console.log('');
    });
    
    // 4. Análisis específico del problema
    console.log('\n🔧 === ANÁLISIS DEL PROBLEMA ===');
    
    // Buscar rutinas que no tienen clientId pero tienen asignaciones
    const routinesWithoutClientId = routines.filter(r => !r.clientId || r.clientId === '');
    console.log(`Rutinas sin clientId: ${routinesWithoutClientId.length}`);
    
    if (routinesWithoutClientId.length > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('Hay rutinas que no tienen clientId asignado directamente.');
      console.log('Esto significa que la relación se maneja a través de RoutineAssignment.');
      console.log('');
      
      // Verificar si estas rutinas tienen asignaciones
      for (const routine of routinesWithoutClientId) {
        const routineAssignments = assignments.filter(a => a.routineId === routine.id);
        console.log(`Rutina "${routine.name}" (${routine.id}):`);
        console.log(`  - Asignaciones: ${routineAssignments.length}`);
        routineAssignments.forEach(assignment => {
          console.log(`    * Cliente: ${assignment.clientId}`);
          console.log(`    * Entrenador: ${assignment.trainerId}`);
        });
        console.log('');
      }
    }
    
    // 5. Sugerencia de corrección
    console.log('\n💡 === SUGERENCIA DE CORRECCIÓN ===');
    console.log('La función resendRoutineEmail busca rutinas con clientId específico,');
    console.log('pero las rutinas pueden estar asignadas solo a través de RoutineAssignment.');
    console.log('');
    console.log('Solución: Modificar la consulta para buscar en RoutineAssignment primero,');
    console.log('y luego obtener la rutina correspondiente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 Iniciando análisis de estructura de rutinas...');
debugRoutineStructure();