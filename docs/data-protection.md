# Protección de Datos: Políticas y Flujo Operativo

Este documento define prácticas para evitar pérdidas de datos y asegurar que operaciones destructivas sólo ocurran con tu aprobación explícita.

## Entornos Separados
- `development`: trabajo local y pruebas manuales.
- `staging`: verificación previa a producción.
- `production`: datos reales. Nunca se ejecutan scripts destructivos sin doble confirmación.

El servidor carga automáticamente `.env.<NODE_ENV>` con fallback a `.env`.

## Reglas de Seguridad
- `ALLOW_DESTRUCTIVE_ACTIONS=false` por defecto en todos los entornos.
- Cualquier operación destructiva requiere dos confirmaciones:
  - Flag de entorno: `ALLOW_DESTRUCTIVE_ACTIONS=true`.
  - Confirmación explícita: `--approve` o variable `CONFIRM_RESET=YES` / `CONFIRM_SQL=YES`.
- En `production`, las operaciones destructivas están bloqueadas si no hay doble confirmación.

## Backups Automáticos
- Antes de cualquier operación destructiva se crea y verifica un backup JSON:
  - `npm run ops:backup`.
  - Los backups se guardan en `backend/backups/` con timestamp.

## Operaciones Seguras
- Reset de base con backup y confirmación (sólo dev):
  - `npm run ops:reset:dev`
- Ejecutar SQL destructivo con backup y confirmación (sólo dev):
  - `npm run ops:sql:delete_clients:dev`

## Comandos por Entorno
- Desarrollo: `npm run start:dev`
- Staging: `npm run start:staging`
- Producción: `npm run start:prod`

## Procedimiento Recomendado
1. Confirmar entorno y `DATABASE_URL` en el `.env.<entorno>`.
2. Crear backup: `npm run ops:backup`.
3. Si es una operación destructiva: habilitar `ALLOW_DESTRUCTIVE_ACTIONS=true` en el `.env` y usar `--approve`.
4. Ejecutar el wrapper seguro correspondiente.
5. Validar resultados y guardar evidencia (archivo de backup y logs).

## Compromiso
- No se borra ni resetea la base sin tu aprobación previa.
- Siempre se genera un backup antes de migrar o limpiar.
- Se mantiene la separación de entornos para no afectar tu trabajo real.