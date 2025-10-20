const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROUTINE_ID = 'cmesmaeoe0001f54eu0bhoxv6'; // ID de "Rutina de Prueba - Reenvío Email"

async function deleteRoutineDirectly() {
  try {
    console.log('🚀 Eliminando rutina directamente desde la base de datos...');
    console.log(`🎯 ID de la rutina: ${ROUTINE_ID}`);
    
    // Primero verificar que la rutina existe
    const routine = await prisma.routine.findUnique({
      where: { id: ROUTINE_ID },
      select: {
        id: true,
        name: true,
        trainerId: true
      }
    });
    
    if (!routine) {
      console.log('❌ La rutina no existe en la base de datos');
      return false;
    }
    
    console.log(`📋 Rutina encontrada: "${routine.name}"`);
    console.log(`👤 Trainer ID: ${routine.trainerId}`);
    
    // Eliminar la rutina
    await prisma.routine.delete({
      where: { id: ROUTINE_ID }
    });
    
    console.log('✅ Rutina eliminada exitosamente de la base de datos');
    
    // Verificar que se eliminó
    const deletedRoutine = await prisma.routine.findUnique({
      where: { id: ROUTINE_ID }
    });
    
    if (!deletedRoutine) {
      console.log('✅ Confirmado: La rutina ya no existe en la base de datos');
      return true;
    } else {
      console.log('❌ Error: La rutina aún existe en la base de datos');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error eliminando rutina:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
deleteRoutineDirectly().then(success => {
  if (success) {
    console.log('🎉 Proceso completado exitosamente');
  } else {
    console.log('❌ No se pudo completar la eliminación');
  }
});