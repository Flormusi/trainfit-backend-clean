# Guía de Pruebas para TrainFit API

Este directorio contiene herramientas para realizar pruebas exhaustivas en la API de TrainFit. A continuación, se detallan los diferentes tipos de pruebas disponibles y cómo ejecutarlas.

## Tipos de Pruebas

### 1. Pruebas Unitarias

Las pruebas unitarias verifican el funcionamiento correcto de componentes individuales de la API.

**Archivo:** `api.test.js`

**Características:**
- Prueba los endpoints de autenticación, dashboard, ejercicios, clientes y rutinas
- Verifica respuestas correctas y manejo de errores
- Utiliza un entorno de prueba aislado con datos de prueba

**Ejecución:**
```bash
npm test
```

### 2. Pruebas de Integración

Las pruebas de integración verifican la comunicación correcta entre el frontend y el backend.

**Archivo:** `/client/src/tests/api_integration.test.js`

**Características:**
- Verifica que el frontend pueda comunicarse correctamente con la API
- Prueba la estructura de las respuestas
- Valida el manejo de errores

**Ejecución:**
```bash
cd ../../../client
node src/tests/api_integration.test.js
```

### 3. Pruebas de Carga

Las pruebas de carga evalúan el rendimiento de la API bajo diferentes niveles de tráfico.

**Archivo:** `load_test.js`

**Características:**
- Realiza múltiples solicitudes concurrentes a los endpoints principales
- Mide tiempos de respuesta y tasas de éxito
- Calcula estadísticas de rendimiento (mínimo, máximo, promedio, percentiles)

**Ejecución:**
```bash
node src/tests/load_test.js
```

## Configuración de Pruebas

### Archivo de Configuración Jest

El archivo `jest.config.js` en la raíz del proyecto backend configura el entorno de pruebas Jest.

### Configuración de Entorno de Pruebas

El archivo `setup.js` configura el entorno para las pruebas unitarias:
- Establece variables de entorno para pruebas
- Configura tiempos de espera
- Silencia logs durante las pruebas
- Maneja promesas no capturadas

## Requisitos Previos

Antes de ejecutar las pruebas, asegúrate de:

1. Tener todas las dependencias instaladas:
   ```bash
   npm install
   ```

2. Generar un token de prueba (necesario para pruebas de integración y carga):
   ```bash
   node test_api_with_token.js
   ```

3. Tener la API en ejecución (para pruebas de integración y carga):
   ```bash
   npm run dev
   ```

## Interpretación de Resultados

### Pruebas Unitarias

Los resultados de las pruebas unitarias se muestran en la consola y se genera un informe HTML en `test-report.html`.

### Pruebas de Integración

Los resultados se muestran en la consola y se guardan en `integration_test_results.json`.

### Pruebas de Carga

Los resultados se muestran en la consola y se guardan en `load_test_results.json`.

## Mejores Prácticas

1. **Ejecuta las pruebas regularmente**, especialmente después de cambios significativos.
2. **Mantén los datos de prueba actualizados** para reflejar el estado actual de la aplicación.
3. **Revisa los informes de pruebas** para identificar áreas de mejora.
4. **Actualiza las pruebas** cuando se agreguen nuevas funcionalidades o se modifiquen las existentes.
5. **Utiliza las pruebas de carga** antes de desplegar a producción para asegurar un rendimiento adecuado.

## Solución de Problemas

### Errores Comunes

1. **Token de autenticación inválido o expirado**:
   - Regenera el token ejecutando `node test_api_with_token.js`

2. **Fallos en pruebas de integración**:
   - Verifica que la API esté en ejecución
   - Comprueba que las rutas y la estructura de respuesta no hayan cambiado

3. **Tiempos de espera en pruebas de carga**:
   - Ajusta los parámetros de concurrencia en `load_test.js`
   - Verifica la disponibilidad de recursos del servidor

### Contacto

Si encuentras problemas con las pruebas, contacta al equipo de desarrollo de TrainFit.