#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Cargar .env por entorno
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `../.env.${env}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

function abort(msg, code = 1) {
  console.error(`❌ ${msg}`);
  process.exit(code);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const map = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.replace(/^--/, '').split('=');
      map[k] = v === undefined ? true : v;
    }
  }
  return map;
}

function generateToken(bytes = 32, encoding = 'hex') {
  // encoding: 'hex' produces 2*bytes length string; 'base64url' slightly shorter
  return crypto.randomBytes(Number(bytes)).toString(encoding);
}

async function notifySlack(message, details) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    const text = `:closed_lock_with_key: Token de aprobación rotado en *${env}*`;
    await axios.post(webhook, {
      text,
      attachments: [
        {
          color: '#36a64f',
          fields: [
            { title: 'Entorno', value: env, short: true },
            { title: 'Archivo', value: path.basename(envPath), short: true },
            { title: 'Ejecutado por', value: process.env.USER || process.env.LOGNAME || 'unknown', short: true },
            { title: 'Hora', value: new Date().toISOString(), short: true },
            { title: 'Detalle', value: details, short: false }
          ]
        }
      ]
    }, { timeout: 5000 });
    return true;
  } catch (err) {
    console.error('⚠️  Error notificando en Slack:', err.message);
    return false;
  }
}

async function notifyEmail(subject, html) {
  const recipients = (process.env.SECURITY_ALERT_EMAILS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) return false;

  try {
    // Configurar transporter mínimo; si no hay credenciales, simular
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('[SIMULADO] Email de alerta a:', recipients.join(', '));
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipients.join(','),
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('⚠️  Error enviando email de alerta:', err.message);
    return false;
  }
}

function maskToken(token) {
  if (!token) return '';
  const start = token.slice(0, 4);
  const end = token.slice(-4);
  return `${start}${'*'.repeat(Math.max(0, token.length - 8))}${end}`;
}

function updateEnvFile(filePath, newToken) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  let found = false;
  const updated = lines.map(line => {
    if (line.startsWith('APPROVAL_TOKEN=')) {
      found = true;
      return `APPROVAL_TOKEN=${newToken}`;
    }
    return line;
  });
  if (!found) {
    updated.push(`APPROVAL_TOKEN=${newToken}`);
  }
  return { original, updated: updated.join('\n') + (updated[updated.length - 1] ? '\n' : '') };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const args = parseArgs();
  const approved = !!args.approve || process.env.CONFIRM_TOKEN_ROTATION === 'YES';
  const tokenArg = args.token || '';
  const lengthArg = args.length ? Number(args.length) : 32; // bytes
  const encoding = args.encoding === 'base64url' ? 'base64url' : 'hex';
  const dryRun = !!args['dry-run'];

  console.log('🔐 Rotación de APPROVAL_TOKEN con notificaciones');
  console.log(`🌿 NODE_ENV: ${env}`);
  console.log(`📄 Archivo .env objetivo: ${envPath}`);

  if (!fs.existsSync(envPath)) {
    abort(`Archivo .env del entorno no existe: ${envPath}`);
  }

  const currentEnvToken = process.env.APPROVAL_TOKEN || '';
  if (!dryRun) {
    if (!approved) {
      abort('Se requiere confirmación explícita. Use --approve o CONFIRM_TOKEN_ROTATION=YES');
    }
    if (!currentEnvToken) {
      abort('APPROVAL_TOKEN actual no está configurado en el .env.');
    }
    if (tokenArg !== currentEnvToken) {
      abort('Token de aprobación inválido. Debe pasar --token=<APPROVAL_TOKEN actual>.');
    }
  }

  const newToken = generateToken(lengthArg, encoding);

  if (dryRun) {
    console.log('🧪 Dry-run activo: no se escribirá el archivo ni se enviarán notificaciones.');
    console.log(`🔑 Token propuesto (${encoding}, ${lengthArg} bytes): ${newToken}`);
    process.exit(0);
  }

  // Backup del .env
  const backupPath = `${envPath}.bak.${Date.now()}`;
  fs.copyFileSync(envPath, backupPath);
  console.log(`🗄️  Backup creado: ${backupPath}`);

  // Actualizar archivo
  const { original, updated } = updateEnvFile(envPath, newToken);
  fs.writeFileSync(envPath, updated, 'utf8');
  console.log('✍️  .env actualizado con nuevo APPROVAL_TOKEN');

  // Verificación simple de escritura
  const verifyContent = fs.readFileSync(envPath, 'utf8');
  if (!verifyContent.includes(`APPROVAL_TOKEN=${newToken}`)) {
    // Restaurar backup
    fs.writeFileSync(envPath, original, 'utf8');
    abort('No se pudo verificar la actualización del token. Se restauró el archivo original.');
  }

  // Logging local
  const logsDir = path.join(__dirname, 'logs');
  ensureDir(logsDir);
  const logLine = `${new Date().toISOString()} | env=${env} | rotated_by=${process.env.USER || 'unknown'} | token=${maskToken(newToken)}\n`;
  fs.appendFileSync(path.join(logsDir, 'token_rotation.log'), logLine, 'utf8');

  // Notificaciones
  const masked = maskToken(newToken);
  const details = `Nuevo token: ${masked}`;
  const slackOk = await notifySlack('Approval token rotated', details);
  const emailOk = await notifyEmail(
    `[Security] Approval token rotated - ${env}`,
    `<p>Se ha rotado el token de aprobación en <strong>${env}</strong>.</p>
     <ul>
       <li>Archivo: ${path.basename(envPath)}</li>
       <li>Ejecutado por: ${process.env.USER || 'unknown'}</li>
       <li>Hora: ${new Date().toISOString()}</li>
       <li>Nuevo token (parcial): <code>${masked}</code></li>
     </ul>
     <p>Nota: el token completo solo se muestra en la terminal del operador.</p>`
  );

  console.log(`📣 Notificaciones -> Slack: ${slackOk ? 'OK' : 'no configurado/fallo'}, Email: ${emailOk ? 'OK' : 'no configurado/fallo'}`);

  // Mostrar el token completo al operador
  console.log('============================================================');
  console.log('🎯 NUEVO APPROVAL_TOKEN (guárdalo en tu gestor de secretos):');
  console.log(newToken);
  console.log('============================================================');
  console.log('✅ Rotación completada. Recuerda actualizar sesiones/variables donde se use el token.');
}

main().catch(err => {
  console.error('💥 Error inesperado en la rotación de token:', err);
  process.exit(1);
});