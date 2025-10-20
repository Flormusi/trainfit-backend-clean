# Checklist Previo a Deploy

Este checklist ayuda a asegurar que releases a staging/producción sean seguros y reproducibles.

## 1. Configuración de entorno
- `NODE_ENV` correcto para el entorno destino.
- `DATABASE_URL` apunta a la base de datos correcta.
- `ALLOWED_ORIGINS` incluye los dominios del entorno.
- `APPROVAL_TOKEN` configurado y compartido sólo con responsables.

## 2. Base de datos
- Ejecutar `npm run ops:backup` en el entorno destino.
- Revisar `backups/` y verificar integridad (`verify_backup.js`).
- Revisar estado de migraciones: `npx prisma migrate status`.
- Plan de rollback claro (backup JSON y versión de schema).

## 3. Seguridad
- `ALLOW_DESTRUCTIVE_ACTIONS=false` por defecto.
- Para scripts destructivos, habilitar temporalmente y requerir:
  - `--approve` y `--token=<APPROVAL_TOKEN>`.
- Rotación periódica de `APPROVAL_TOKEN`.

## 4. Emails/Servicios externos
- `EMAIL_USER`/`EMAIL_PASS` configurados.
- Cloudinary keys (`CLOUDINARY_*`) configuradas.
- Probar email con `node test_email.js` (si aplica).

## 5. Aplicación
- Backend: `npm run start:staging`/`npm run start:prod`.
- Frontend: variables `.env` correctas y build sin warnings.
- Healthcheck: `GET /api/health` responde `status: ok`.

## 6. Observabilidad
- Logs activos y accesibles (`logs/`).
- Alertas básicas en errores críticos.
- Confirmar no hay `console.log` ruidosos en producción.

## 7. Aprobación final
- Validación del responsable de datos.
- Registrar evidencia: backup, comandos ejecutados, versión de release.
- Ventana de despliegue acordada y comunicación al equipo.