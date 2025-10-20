/**
 * Script para ejecutar todas las pruebas de la API de TrainFit
 * Este script ejecuta pruebas unitarias, de integración y de carga en secuencia
 * y genera un informe consolidado de los resultados.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  // Directorio raíz del proyecto backend
  backendRoot: path.resolve(__dirname, '../..'),
  // Directorio raíz del proyecto cliente
  clientRoot: path.resolve(__dirname, '../../../client'),
  // Ruta para guardar el informe consolidado
  reportPath: path.join(__dirname, 'test_report_summary.md'),
  // Tiempo máximo de ejecución para cada tipo de prueba (ms)
  timeouts: {
    unit: 60000,      // 1 minuto
    integration: 60000, // 1 minuto
    load: 300000       // 5 minutos
  }
};

// Función para formatear la fecha y hora
const getFormattedDateTime = () => {
  const now = new Date();
  return now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

// Función para ejecutar un comando y capturar la salida
const runCommand = (command, cwd, timeout) => {
  return new Promise((resolve, reject) => {
    console.log(`\n\n=== Ejecutando: ${command} ===\n`);
    
    const startTime = Date.now();
    let output = '';
    let error = '';
    
    const childProcess = spawn('sh', ['-c', command], { cwd });
    
    childProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });
    
    childProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      error += chunk;
      process.stderr.write(chunk);
    });
    
    const timer = setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Tiempo de espera agotado después de ${timeout / 1000} segundos`));
    }, timeout);
    
    childProcess.on('close', (code) => {
      clearTimeout(timer);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      if (code === 0) {
        resolve({ success: true, output, duration });
      } else {
        resolve({ success: false, output, error, duration, code });
      }
    });
    
    childProcess.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

// Función para generar un token de prueba
const generateTestToken = async () => {
  console.log('\n=== Generando token de prueba ===');
  try {
    const result = await runCommand('node test_api_with_token.js', CONFIG.backendRoot, 30000);
    return result.success;
  } catch (error) {
    console.error('Error al generar token de prueba:', error);
    return false;
  }
};

// Función para ejecutar pruebas unitarias
const runUnitTests = async () => {
  console.log('\n=== Ejecutando pruebas unitarias ===');
  try {
    return await runCommand('npm test', CONFIG.backendRoot, CONFIG.timeouts.unit);
  } catch (error) {
    console.error('Error al ejecutar pruebas unitarias:', error);
    return { success: false, error: error.message, duration: 0 };
  }
};

// Función para ejecutar pruebas de integración
const runIntegrationTests = async () => {
  console.log('\n=== Ejecutando pruebas de integración ===');
  try {
    return await runCommand('node src/tests/api_integration.test.js', CONFIG.clientRoot, CONFIG.timeouts.integration);
  } catch (error) {
    console.error('Error al ejecutar pruebas de integración:', error);
    return { success: false, error: error.message, duration: 0 };
  }
};

// Función para ejecutar pruebas de carga
const runLoadTests = async () => {
  console.log('\n=== Ejecutando pruebas de carga ===');
  try {
    return await runCommand('node src/tests/load_test.js', CONFIG.backendRoot, CONFIG.timeouts.load);
  } catch (error) {
    console.error('Error al ejecutar pruebas de carga:', error);
    return { success: false, error: error.message, duration: 0 };
  }
};

// Función para leer y analizar resultados de pruebas
const parseTestResults = () => {
  const results = {
    unit: null,
    integration: null,
    load: null
  };
  
  // Intentar leer resultados de pruebas unitarias
  try {
    const jestResultPath = path.join(CONFIG.backendRoot, 'test-report.html');
    if (fs.existsSync(jestResultPath)) {
      results.unit = { exists: true, path: jestResultPath };
    }
  } catch (error) {
    console.error('Error al leer resultados de pruebas unitarias:', error);
  }
  
  // Intentar leer resultados de pruebas de integración
  try {
    const integrationResultPath = path.join(CONFIG.clientRoot, 'src/tests/integration_test_results.json');
    if (fs.existsSync(integrationResultPath)) {
      const data = JSON.parse(fs.readFileSync(integrationResultPath, 'utf8'));
      results.integration = { exists: true, path: integrationResultPath, data };
    }
  } catch (error) {
    console.error('Error al leer resultados de pruebas de integración:', error);
  }
  
  // Intentar leer resultados de pruebas de carga
  try {
    const loadResultPath = path.join(__dirname, 'load_test_results.json');
    if (fs.existsSync(loadResultPath)) {
      const data = JSON.parse(fs.readFileSync(loadResultPath, 'utf8'));
      results.load = { exists: true, path: loadResultPath, data };
    }
  } catch (error) {
    console.error('Error al leer resultados de pruebas de carga:', error);
  }
  
  return results;
};

// Función para generar informe consolidado
const generateReport = (testResults, executionResults) => {
  const { unit, integration, load } = executionResults;
  const results = parseTestResults();
  
  let report = `# Informe de Pruebas TrainFit API\n\n`;
  report += `**Fecha:** ${getFormattedDateTime()}\n\n`;
  
  report += `## Resumen de Ejecución\n\n`;
  report += `| Tipo de Prueba | Estado | Duración (s) |\n`;
  report += `|---------------|--------|-------------|\n`;
  report += `| Unitarias | ${unit.success ? '✅ Éxito' : '❌ Fallo'} | ${unit.duration.toFixed(2)} |\n`;
  report += `| Integración | ${integration.success ? '✅ Éxito' : '❌ Fallo'} | ${integration.duration.toFixed(2)} |\n`;
  report += `| Carga | ${load.success ? '✅ Éxito' : '❌ Fallo'} | ${load.duration.toFixed(2)} |\n\n`;
  
  // Detalles de pruebas unitarias
  report += `## Pruebas Unitarias\n\n`;
  if (results.unit && results.unit.exists) {
    report += `Informe detallado disponible en: ${results.unit.path}\n\n`;
  } else {
    report += `No se encontró el informe de pruebas unitarias.\n\n`;
  }
  
  // Detalles de pruebas de integración
  report += `## Pruebas de Integración\n\n`;
  if (results.integration && results.integration.exists) {
    const data = results.integration.data;
    report += `**Total de pruebas:** ${data.total}\n`;
    report += `**Pruebas exitosas:** ${data.passed}\n`;
    report += `**Pruebas fallidas:** ${data.failed}\n\n`;
    
    if (data.tests && data.tests.length > 0) {
      report += `### Detalle de Pruebas\n\n`;
      report += `| Prueba | Estado |\n`;
      report += `|--------|--------|\n`;
      
      data.tests.forEach(test => {
        report += `| ${test.name} | ${test.status === 'passed' ? '✅ Éxito' : '❌ Fallo'} |\n`;
      });
      
      report += `\n`;
    }
  } else {
    report += `No se encontró el informe de pruebas de integración.\n\n`;
  }
  
  // Detalles de pruebas de carga
  report += `## Pruebas de Carga\n\n`;
  if (results.load && results.load.exists) {
    const data = results.load.data;
    
    if (data.global && data.global.stats) {
      const stats = data.global.stats;
      report += `### Estadísticas Globales\n\n`;
      report += `| Métrica | Valor |\n`;
      report += `|---------|-------|\n`;
      report += `| Total de solicitudes | ${stats.totalRequests} |\n`;
      report += `| Tasa de éxito | ${stats.successRate.toFixed(2)}% |\n`;
      report += `| Tiempo de respuesta promedio | ${stats.avgResponseTime.toFixed(2)}ms |\n`;
      report += `| Tiempo de respuesta mínimo | ${stats.minResponseTime}ms |\n`;
      report += `| Tiempo de respuesta máximo | ${stats.maxResponseTime}ms |\n`;
      report += `| Percentil 50 (mediana) | ${stats.p50ResponseTime}ms |\n`;
      report += `| Percentil 90 | ${stats.p90ResponseTime}ms |\n`;
      report += `| Percentil 95 | ${stats.p95ResponseTime}ms |\n`;
      report += `| Percentil 99 | ${stats.p99ResponseTime}ms |\n\n`;
    }
    
    // Detalles por endpoint
    report += `### Resultados por Endpoint\n\n`;
    report += `| Endpoint | Método | Solicitudes | Tasa de Éxito | Tiempo Promedio (ms) |\n`;
    report += `|----------|--------|-------------|--------------|---------------------|\n`;
    
    Object.keys(data).forEach(key => {
      if (key !== 'global' && data[key].stats) {
        const endpoint = data[key];
        report += `| ${endpoint.endpoint} | ${endpoint.method} | ${endpoint.stats.totalRequests} | ${endpoint.stats.successRate.toFixed(2)}% | ${endpoint.stats.avgResponseTime.toFixed(2)} |\n`;
      }
    });
    
    report += `\n`;
  } else {
    report += `No se encontró el informe de pruebas de carga.\n\n`;
  }
  
  // Recomendaciones
  report += `## Recomendaciones\n\n`;
  
  // Analizar resultados y generar recomendaciones
  const recommendations = [];
  
  if (!unit.success) {
    recommendations.push('Revisar y corregir las pruebas unitarias fallidas.');
  }
  
  if (!integration.success) {
    recommendations.push('Verificar la comunicación entre el frontend y el backend.');
  }
  
  if (results.load && results.load.exists) {
    const stats = results.load.data.global.stats;
    
    if (stats.successRate < 95) {
      recommendations.push(`Mejorar la tasa de éxito en las solicitudes (actual: ${stats.successRate.toFixed(2)}%).`);
    }
    
    if (stats.avgResponseTime > 500) {
      recommendations.push(`Optimizar el tiempo de respuesta promedio (actual: ${stats.avgResponseTime.toFixed(2)}ms).`);
    }
    
    if (stats.p95ResponseTime > 1000) {
      recommendations.push(`Reducir el tiempo de respuesta para el percentil 95 (actual: ${stats.p95ResponseTime}ms).`);
    }
  }
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  } else {
    report += `- Todas las pruebas se ejecutaron correctamente. No se requieren acciones inmediatas.\n`;
  }
  
  return report;
};

// Función principal para ejecutar todas las pruebas
const runAllTests = async () => {
  console.log('=== INICIANDO EJECUCIÓN DE TODAS LAS PRUEBAS ===');
  console.log(`Fecha y hora: ${getFormattedDateTime()}`);
  
  // Generar token de prueba
  const tokenGenerated = await generateTestToken();
  if (!tokenGenerated) {
    console.error('No se pudo generar el token de prueba. Abortando pruebas.');
    process.exit(1);
  }
  
  // Ejecutar pruebas unitarias
  const unitResults = await runUnitTests();
  
  // Ejecutar pruebas de integración
  const integrationResults = await runIntegrationTests();
  
  // Ejecutar pruebas de carga
  const loadResults = await runLoadTests();
  
  // Generar informe consolidado
  const executionResults = {
    unit: unitResults,
    integration: integrationResults,
    load: loadResults
  };
  
  const testResults = parseTestResults();
  const report = generateReport(testResults, executionResults);
  
  // Guardar informe
  fs.writeFileSync(CONFIG.reportPath, report);
  console.log(`\n\n=== INFORME CONSOLIDADO GUARDADO EN: ${CONFIG.reportPath} ===`);
  
  // Determinar si todas las pruebas fueron exitosas
  const allTestsSuccessful = unitResults.success && integrationResults.success && loadResults.success;
  
  console.log(`\n=== RESUMEN DE EJECUCIÓN ===`);
  console.log(`Pruebas unitarias: ${unitResults.success ? 'ÉXITO' : 'FALLO'}`);
  console.log(`Pruebas de integración: ${integrationResults.success ? 'ÉXITO' : 'FALLO'}`);
  console.log(`Pruebas de carga: ${loadResults.success ? 'ÉXITO' : 'FALLO'}`);
  console.log(`Estado general: ${allTestsSuccessful ? 'ÉXITO' : 'FALLO'}`);
  
  return allTestsSuccessful;
};

// Ejecutar todas las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error al ejecutar las pruebas:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  runUnitTests,
  runIntegrationTests,
  runLoadTests,
  generateReport
};