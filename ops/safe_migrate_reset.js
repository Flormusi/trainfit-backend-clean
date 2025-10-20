#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Cargar .env por entorno
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `../.env.${env}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const { createBackup } = require('../create_backup');
const { verifyBackup } = require('../verify_backup');

function abort(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  console.log('🔒 Ejecutando reset seguro con backup previo');
  console.log(`🌿 NODE_ENV: ${env}`);
  console.log(`🗄️ DATABASE_URL: ${process.env.DATABASE_URL || '(no configurado)'}`);

  const args = process.argv.slice(2);
  const approved = args.includes('--approve') || process.env.CONFIRM_RESET === 'YES';
  const allowDestructive = String(process.env.ALLOW_DESTRUCTIVE_ACTIONS).toLowerCase() === 'true';
  const envToken = process.env.APPROVAL_TOKEN || '';
  const tokenArg = (args.find(a => a.startsWith('--token=')) || '').split('=')[1] || '';

  // Bloquear en producción por defecto
  if (env === 'production' && !approved) {
    abort('Reset bloqueado en producción. Usa --approve y CONFIRM_RESET=YES explícito.');
  }

  if (!allowDestructive) {
    abort('Acciones destructivas deshabilitadas. Establece ALLOW_DESTRUCTIVE_ACTIONS=true en .env del entorno.');
  }

  if (!approved) {
    abort('Se requiere confirmación explícita. Ejecuta con --approve o CONFIRM_RESET=YES.');
  }

  if (!envToken) {
    abort('APPROVAL_TOKEN no configurado en el .env del entorno.');
  }

  if (tokenArg !== envToken) {
    abort('Token de aprobación inválido o faltante. Usa --token=<APPROVAL_TOKEN> correcto.');
  }

  // 1) Crear backup
  const backupFile = await createBackup();
  const verification = verifyBackup(backupFile);
  if (!verification.valid) {
    abort('Backup inválido. Abortando reset.');
  }

  console.log('✅ Backup verificado. Procediendo con prisma migrate reset...');

  try {
    // 2) Ejecutar reset de prisma (forzado)
    execSync('npx prisma migrate reset --force --skip-generate --skip-seed', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('🎉 Reset completado exitosamente.');
  } catch (error) {
    console.error('💥 Error ejecutando prisma migrate reset:', error.message);
    abort('Fallo en reset. Revisa el error y considera restaurar desde el backup.');
  }
}

main();