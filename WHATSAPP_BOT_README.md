# Bot de WhatsApp para Generación Automática de Rutinas

Este bot permite a los entrenadores solicitar rutinas de entrenamiento automáticamente a través de WhatsApp, procesando objetivos específicos y generando rutinas personalizadas.

## Configuración

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN="tu-token-de-acceso"
WHATSAPP_PHONE_NUMBER_ID="tu-id-de-numero-de-telefono"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="tu-token-de-verificacion"
WHATSAPP_BUSINESS_ACCOUNT_ID="tu-id-de-cuenta-de-negocio"

# Configuración del Bot
BOT_ENABLED=true
BOT_DEBUG=false
```

### 2. Configuración de WhatsApp Business API

1. **Crear una aplicación en Meta for Developers:**
   - Ve a https://developers.facebook.com/
   - Crea una nueva aplicación
   - Agrega el producto "WhatsApp Business API"

2. **Configurar el webhook:**
   - URL del webhook: `https://tu-dominio.com/api/whatsapp/webhook`
   - Token de verificación: el mismo que configuraste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Eventos a suscribir: `messages`

3. **Obtener tokens y IDs:**
   - Access Token: desde la consola de WhatsApp Business API
   - Phone Number ID: ID del número de teléfono de prueba o producción
   - Business Account ID: desde la configuración de la cuenta de negocio

## Uso del Bot

### Comandos Disponibles

Los entrenadores pueden enviar mensajes con los siguientes formatos:

1. **Solicitar rutina por objetivo:**
   ```
   Rutina para ganar masa muscular
   Rutina para perder peso
   Rutina para mejorar resistencia
   Rutina para tonificar
   ```

2. **Solicitar rutina específica:**
   ```
   Rutina de pecho y tríceps
   Rutina de piernas
   Rutina de espalda y bíceps
   ```

### Flujo de Funcionamiento

1. **Recepción del mensaje:** El bot recibe el mensaje del entrenador
2. **Validación:** Verifica que el número de teléfono pertenezca a un entrenador registrado
3. **Procesamiento:** Analiza el objetivo solicitado
4. **Generación:** Crea una rutina basada en los ejercicios disponibles
5. **Respuesta:** Envía la rutina formateada al entrenador
6. **Guardado:** Almacena la rutina en la base de datos

## API Endpoints

### Webhook de WhatsApp
- `GET /api/whatsapp/webhook` - Verificación del webhook
- `POST /api/whatsapp/webhook` - Recepción de mensajes

### Endpoints de Administración
- `POST /api/whatsapp/test-message` - Enviar mensaje de prueba (requiere autenticación)
- `GET /api/whatsapp/status` - Estado del servicio (requiere autenticación)

## Estructura de Respuesta

Cuando se genera una rutina, el bot responde con el siguiente formato:

```
🏋️ RUTINA GENERADA

📋 Objetivo: [objetivo solicitado]
⏱️ Duración estimada: [tiempo]

💪 EJERCICIOS:

1. [Nombre del ejercicio]
   • Series: [número]
   • Repeticiones: [número]
   • Descanso: [tiempo]
   • Descripción: [instrucciones]

[... más ejercicios]

✅ Rutina guardada en el sistema
🆔 ID: [id de la rutina]
```

## Desarrollo y Debug

### Activar modo debug
```bash
BOT_DEBUG=true
```

Esto habilitará logs detallados en la consola.

### Probar el bot localmente

1. Usar ngrok para exponer el servidor local:
   ```bash
   ngrok http 3000
   ```

2. Configurar la URL del webhook en Meta for Developers con la URL de ngrok

3. Enviar mensajes de prueba desde WhatsApp

## Limitaciones Actuales

- Solo funciona con entrenadores registrados en el sistema
- Genera rutinas basadas en ejercicios predefinidos en la base de datos
- No incluye integración con OpenAI (implementación simplificada)
- Respuestas en formato de texto plano

## Próximas Mejoras

- [ ] Integración con OpenAI para generación más inteligente
- [ ] Soporte para imágenes y videos en las respuestas
- [ ] Rutinas personalizadas por cliente específico
- [ ] Historial de rutinas generadas por entrenador
- [ ] Notificaciones automáticas de seguimiento

## Troubleshooting

### El bot no responde
1. Verificar que `BOT_ENABLED=true`
2. Comprobar los logs del servidor
3. Verificar la configuración del webhook en Meta
4. Confirmar que el entrenador está registrado

### Errores de autenticación
1. Verificar el `WHATSAPP_ACCESS_TOKEN`
2. Comprobar que el token no haya expirado
3. Verificar los permisos de la aplicación en Meta

### Rutinas no se generan
1. Verificar que existan ejercicios en la base de datos
2. Comprobar la conexión a la base de datos
3. Revisar los logs de error en el servicio de IA