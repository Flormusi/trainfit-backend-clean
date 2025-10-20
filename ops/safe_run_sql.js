#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Cargar .env por entorno
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `../.env.${env}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const prisma = new PrismaClient();
const { createBackup } = require('../create_backup');
const { verifyBackup } = require('../verify_backup');

function abort(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const sqlFileArg = process.argv[2];
  if (!sqlFileArg) {
    abort('Debes especificar la ruta al archivo SQL. Ej: node ops/safe_run_sql.js scripts/delete_clients.sql');
  }
  const approved = process.argv.includes('--approve') || process.env.CONFIRM_SQL === 'YES';
  const allowDestructive = String(process.env.ALLOW_DESTRUCTIVE_ACTIONS).toLowerCase() === 'true';
  const envToken = process.env.APPROVAL_TOKEN || '';
  const tokenArg = (process.argv.find(a => a.startsWith('--token=')) || '').split('=')[1] || '';

  console.log('🔒 Ejecutando SQL con guardas: backup + confirmación');
  console.log(`🌿 NODE_ENV: ${env}`);
  console.log(`🗄️ DATABASE_URL: ${process.env.DATABASE_URL || '(no configurado)'}`);
  console.log(`📄 SQL file: ${sqlFileArg}`);

  if (env === 'production' && !approved) {
    abort('SQL destructivo bloqueado en producción. Usa --approve y CONFIRM_SQL=YES explícito.');
  }

  if (!allowDestructive) {
    abort('Acciones destructivas deshabilitadas. Establece ALLOW_DESTRUCTIVE_ACTIONS=true en .env del entorno.');
  }

  if (!approved) {
    abort('Se requiere confirmación explícita. Ejecuta con --approve o CONFIRM_SQL=YES.');
  }

  if (!envToken) {
    abort('APPROVAL_TOKEN no configurado en el .env del entorno.');
  }

  if (tokenArg !== envToken) {
    abort('Token de aprobación inválido o faltante. Usa --token=<APPROVAL_TOKEN> correcto.');
  }

  const sqlPath = path.isAbsolute(sqlFileArg)
    ? sqlFileArg
    : path.join(process.cwd(), sqlFileArg);

  if (!fs.existsSync(sqlPath)) {
    abort(`Archivo SQL no encontrado: ${sqlPath}`);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  if (!sqlContent.trim()) {
    abort('El archivo SQL está vacío.');
  }

  // 1) Backup
  const backupFile = await createBackup();
  const verification = verifyBackup(backupFile);
  if (!verification.valid) {
    abort('Backup inválido. Abortando ejecución SQL.');
  }

  console.log('✅ Backup verificado. Ejecutando SQL...');

  try {
    // Ejecutar el SQL completo (asumimos sentencias bien formadas)
    await prisma.$executeRawUnsafe(sqlContent);
    console.log('🎉 SQL ejecutado exitosamente.');
  } catch (error) {
    console.error('💥 Error ejecutando SQL:', error.message);
    abort('Fallo al ejecutar SQL. Considera restaurar desde el backup.');
  } finally {
    await prisma.$disconnect();
  }
}

main();