const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log('🔄 Iniciando backup de la base de datos...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, 'backups');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const backupFile = path.join(backupDir, `trainfit_backup_${timestamp}.json`);
    
    // Obtener todos los datos de las tablas principales
    const backup = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany(),
      clientProfiles: await prisma.clientProfile.findMany(),
      trainerProfiles: await prisma.trainerProfile.findMany(),
      routines: await prisma.routine.findMany(),
      routineAssignments: await prisma.routineAssignment.findMany(),
      progress: await prisma.progress.findMany(),
      notifications: await prisma.notification.findMany(),
      trainerClients: await prisma.trainerClient.findMany(),
      subscriptions: await prisma.subscription.findMany(),
      payments: await prisma.payment.findMany(),
      exercises: await prisma.exercise.findMany(),
      nutritionPlans: await prisma.nutritionPlan.findMany(),
      appointments: await prisma.appointment.findMany(),
      messages: await prisma.message.findMany(),
      clientNotes: await prisma.clientNote.findMany(),
      reminders: await prisma.reminder.findMany(),
      invoices: await prisma.invoice.findMany()
    };
    
    // Escribir backup a archivo
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup creado exitosamente: ${backupFile}`);
    console.log(`📊 Estadísticas del backup:`);
    console.log(`   - Usuarios: ${backup.users.length}`);
    console.log(`   - Perfiles de clientes: ${backup.clientProfiles.length}`);
    console.log(`   - Perfiles de entrenadores: ${backup.trainerProfiles.length}`);
    console.log(`   - Rutinas: ${backup.routines.length}`);
    console.log(`   - Asignaciones: ${backup.routineAssignments.length}`);
    console.log(`   - Progreso: ${backup.progress.length}`);
    console.log(`   - Notificaciones: ${backup.notifications.length}`);
    console.log(`   - Ejercicios: ${backup.exercises.length}`);
    console.log(`   - Planes nutricionales: ${backup.nutritionPlans.length}`);
    console.log(`   - Citas: ${backup.appointments.length}`);
    console.log(`   - Mensajes: ${backup.messages.length}`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createBackup()
    .then((file) => {
      console.log(`🎯 Backup completado: ${file}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso de backup:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };