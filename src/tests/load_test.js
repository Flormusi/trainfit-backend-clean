/**
 * Pruebas de carga para la API de TrainFit
 * Este script realiza pruebas de carga para verificar el rendimiento de la API
 * bajo diferentes niveles de tráfico.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración de la prueba
const CONFIG = {
  // URL base de la API
  apiUrl: process.env.API_URL || 'http://localhost:5000/api',
  // Número de solicitudes concurrentes
  concurrentRequests: 10,
  // Número total de solicitudes por endpoint
  totalRequests: 100,
  // Tiempo de espera entre lotes de solicitudes (ms)
  batchDelay: 1000,
  // Tamaño del lote de solicitudes concurrentes
  batchSize: 10,
  // Endpoints a probar
  endpoints: [
    { path: '/trainer/dashboard', method: 'get' },
    { path: '/trainer/clients', method: 'get' },
    { path: '/trainer/exercises', method: 'get' },
    { path: '/trainer/routines', method: 'get' },
    { path: '/trainer/analytics', method: 'get' }
  ],
  // Ruta para guardar los resultados
  resultsPath: path.join(__dirname, 'load_test_results.json')
};

// Función para leer el token de prueba
const getTestToken = () => {
  try {
    const tokenPath = path.join(__dirname, '..', '..', '..', 'client', 'src', 'token.txt');
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
    console.error('Archivo de token no encontrado:', tokenPath);
    return null;
  } catch (error) {
    console.error('Error al leer el token de prueba:', error);
    return null;
  }
};

// Cliente HTTP configurado
const createApiClient = (token) => {
  return axios.create({
    baseURL: CONFIG.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
};

// Función para realizar una solicitud y medir el tiempo
const makeRequest = async (client, endpoint) => {
  const startTime = Date.now();
  let status = 'success';
  let statusCode = null;
  let error = null;
  
  try {
    const response = await client[endpoint.method](endpoint.path);
    statusCode = response.status;
  } catch (err) {
    status = 'error';
    statusCode = err.response ? err.response.status : null;
    error = err.message;
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    endpoint: endpoint.path,
    method: endpoint.method.toUpperCase(),
    duration,
    status,
    statusCode,
    error,
    timestamp: new Date().toISOString()
  };
};

// Función para esperar un tiempo determinado
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para ejecutar pruebas de carga para un endpoint
const loadTestEndpoint = async (client, endpoint) => {
  console.log(`Iniciando prueba de carga para ${endpoint.method.toUpperCase()} ${endpoint.path}`);
  
  const results = [];
  const totalBatches = Math.ceil(CONFIG.totalRequests / CONFIG.batchSize);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const batchPromises = [];
    const remainingRequests = CONFIG.totalRequests - (batch * CONFIG.batchSize);
    const currentBatchSize = Math.min(CONFIG.batchSize, remainingRequests);
    
    console.log(`Ejecutando lote ${batch + 1}/${totalBatches} (${currentBatchSize} solicitudes)...`);
    
    for (let i = 0; i < currentBatchSize; i++) {
      batchPromises.push(makeRequest(client, endpoint));
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (batch < totalBatches - 1) {
      console.log(`Esperando ${CONFIG.batchDelay}ms antes del siguiente lote...`);
      await sleep(CONFIG.batchDelay);
    }
  }
  
  return results;
};

// Función para calcular estadísticas
const calculateStats = (results) => {
  if (results.length === 0) return {};
  
  const durations = results.map(r => r.duration);
  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');
  
  // Ordenar duraciones para calcular percentiles
  durations.sort((a, b) => a - b);
  
  const min = durations[0];
  const max = durations[durations.length - 1];
  const sum = durations.reduce((acc, val) => acc + val, 0);
  const avg = sum / durations.length;
  
  // Calcular percentiles
  const p50Index = Math.floor(durations.length * 0.5);
  const p90Index = Math.floor(durations.length * 0.9);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  
  return {
    totalRequests: results.length,
    successCount: successResults.length,
    errorCount: errorResults.length,
    successRate: (successResults.length / results.length) * 100,
    minResponseTime: min,
    maxResponseTime: max,
    avgResponseTime: avg,
    p50ResponseTime: durations[p50Index],
    p90ResponseTime: durations[p90Index],
    p95ResponseTime: durations[p95Index],
    p99ResponseTime: durations[p99Index],
  };
};

// Función principal para ejecutar todas las pruebas de carga
const runLoadTests = async () => {
  console.log('=== INICIANDO PRUEBAS DE CARGA PARA LA API DE TRAINFIT ===');
  console.log(`URL de la API: ${CONFIG.apiUrl}`);
  console.log(`Solicitudes concurrentes: ${CONFIG.concurrentRequests}`);
  console.log(`Total de solicitudes por endpoint: ${CONFIG.totalRequests}`);
  console.log('======================================================');
  
  const token = getTestToken();
  if (!token) {
    console.error('No se encontró un token de prueba. Ejecute primero test_api_with_token.js');
    process.exit(1);
  }
  
  const client = createApiClient(token);
  const allResults = {};
  
  // Ejecutar pruebas para cada endpoint
  for (const endpoint of CONFIG.endpoints) {
    const endpointKey = `${endpoint.method}_${endpoint.path.replace(/\//g, '_')}`;
    const results = await loadTestEndpoint(client, endpoint);
    const stats = calculateStats(results);
    
    allResults[endpointKey] = {
      endpoint: endpoint.path,
      method: endpoint.method.toUpperCase(),
      stats,
      requests: results
    };
    
    // Mostrar estadísticas para este endpoint
    console.log(`\n--- Resultados para ${endpoint.method.toUpperCase()} ${endpoint.path} ---`);
    console.log(`Total de solicitudes: ${stats.totalRequests}`);
    console.log(`Tasa de éxito: ${stats.successRate.toFixed(2)}%`);
    console.log(`Tiempo de respuesta promedio: ${stats.avgResponseTime.toFixed(2)}ms`);
    console.log(`Tiempo de respuesta mínimo: ${stats.minResponseTime}ms`);
    console.log(`Tiempo de respuesta máximo: ${stats.maxResponseTime}ms`);
    console.log(`Percentil 50 (mediana): ${stats.p50ResponseTime}ms`);
    console.log(`Percentil 90: ${stats.p90ResponseTime}ms`);
    console.log(`Percentil 95: ${stats.p95ResponseTime}ms`);
    console.log(`Percentil 99: ${stats.p99ResponseTime}ms`);
  }
  
  // Calcular estadísticas globales
  const allRequestResults = Object.values(allResults).flatMap(r => r.requests);
  const globalStats = calculateStats(allRequestResults);
  
  allResults.global = {
    stats: globalStats
  };
  
  // Mostrar estadísticas globales
  console.log('\n=== ESTADÍSTICAS GLOBALES ===');
  console.log(`Total de solicitudes: ${globalStats.totalRequests}`);
  console.log(`Tasa de éxito: ${globalStats.successRate.toFixed(2)}%`);
  console.log(`Tiempo de respuesta promedio: ${globalStats.avgResponseTime.toFixed(2)}ms`);
  console.log(`Tiempo de respuesta mínimo: ${globalStats.minResponseTime}ms`);
  console.log(`Tiempo de respuesta máximo: ${globalStats.maxResponseTime}ms`);
  console.log(`Percentil 50 (mediana): ${globalStats.p50ResponseTime}ms`);
  console.log(`Percentil 90: ${globalStats.p90ResponseTime}ms`);
  console.log(`Percentil 95: ${globalStats.p95ResponseTime}ms`);
  console.log(`Percentil 99: ${globalStats.p99ResponseTime}ms`);
  
  // Guardar resultados en un archivo
  fs.writeFileSync(CONFIG.resultsPath, JSON.stringify(allResults, null, 2));
  console.log(`\nResultados guardados en: ${CONFIG.resultsPath}`);
  
  return allResults;
};

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  runLoadTests()
    .then(() => {
      console.log('Pruebas de carga completadas.');
    })
    .catch((error) => {
      console.error('Error al ejecutar las pruebas de carga:', error);
      process.exit(1);
    });
}

module.exports = {
  runLoadTests,
  calculateStats
};