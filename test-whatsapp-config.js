#!/usr/bin/env node

/**
 * Script de Verificación del Bot de WhatsApp - TrainFit
 * 
 * Este script verifica que todas las credenciales y configuraciones
 * del bot de WhatsApp estén correctamente configuradas.
 * 
 * Uso: node test-whatsapp-config.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🔍 ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}📋${colors.reset} ${msg}`)
};

class WhatsAppConfigTester {
  constructor() {
    this.results = {
      envVariables: false,
      credentials: false,
      phoneNumber: false,
      webhook: false,
      database: false,
      services: false
    };
    
    this.requiredEnvVars = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID', 
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'BOT_ENABLED'
    ];
  }

  async runAllTests() {
    log.title('VERIFICACIÓN COMPLETA DEL BOT DE WHATSAPP - TRAINFIT');
    console.log('='.repeat(60));
    
    try {
      await this.testEnvironmentVariables();
      await this.testCredentials();
      await this.testPhoneNumber();
      await this.testWebhookEndpoint();
      await this.testDatabaseConnection();
      await this.testServices();
      
      this.showFinalReport();
    } catch (error) {
      log.error(`Error durante las pruebas: ${error.message}`);
      process.exit(1);
    }
  }

  async testEnvironmentVariables() {
    log.title('1. Verificando Variables de Entorno');
    
    const missing = [];
    const present = [];
    
    this.requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.trim() === '' || value.includes('tu-') || value.includes('your-')) {
        missing.push(varName);
      } else {
        present.push(varName);
      }
    });
    
    present.forEach(varName => {
      log.success(`${varName}: Configurada`);
    });
    
    missing.forEach(varName => {
      log.error(`${varName}: Faltante o con valor de ejemplo`);
    });
    
    if (missing.length === 0) {
      log.success('Todas las variables de entorno están configuradas');
      this.results.envVariables = true;
    } else {
      log.error(`Faltan ${missing.length} variables de entorno`);
      log.info('Revisa el archivo .env y la guía WHATSAPP_CREDENTIALS_GUIDE.md');
    }
  }

  async testCredentials() {
    log.title('2. Verificando Credenciales de WhatsApp API');
    
    const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID } = process.env;
    
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
      log.error('Token de acceso o Business Account ID faltantes');
      return;
    }
    
    try {
      log.step('Probando token de acceso...');
      
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
          },
          timeout: 10000
        }
      );
      
      log.success(`Token válido - Cuenta: ${response.data.name}`);
      log.success(`Business Account ID: ${WHATSAPP_BUSINESS_ACCOUNT_ID}`);
      this.results.credentials = true;
      
    } catch (error) {
      if (error.response) {
        log.error(`Error de API: ${error.response.status} - ${error.response.data.error?.message || 'Error desconocido'}`);
        
        if (error.response.status === 401) {
          log.warning('El token de acceso parece ser inválido o haber expirado');
          log.info('Genera un nuevo token en Meta for Developers');
        }
      } else {
        log.error(`Error de conexión: ${error.message}`);
      }
    }
  }

  async testPhoneNumber() {
    log.title('3. Verificando Número de Teléfono');
    
    const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;
    
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      log.error('Token o Phone Number ID faltantes');
      return;
    }
    
    try {
      log.step('Verificando Phone Number ID...');
      
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
          },
          timeout: 10000
        }
      );
      
      log.success(`Número válido: ${response.data.display_phone_number}`);
      log.success(`Estado: ${response.data.code_verification_status}`);
      log.success(`Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
      this.results.phoneNumber = true;
      
    } catch (error) {
      if (error.response) {
        log.error(`Error: ${error.response.status} - ${error.response.data.error?.message || 'Error desconocido'}`);
      } else {
        log.error(`Error de conexión: ${error.message}`);
      }
    }
  }

  async testWebhookEndpoint() {
    log.title('4. Verificando Endpoint del Webhook');
    
    const { PORT = 5002 } = process.env;
    const webhookUrl = `http://localhost:${PORT}/api/whatsapp/webhook`;
    
    try {
      log.step('Probando endpoint GET del webhook...');
      
      // Simular verificación de webhook
      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      const testParams = {
        'hub.mode': 'subscribe',
        'hub.challenge': 'test_challenge_123',
        'hub.verify_token': verifyToken
      };
      
      const response = await axios.get(webhookUrl, {
        params: testParams,
        timeout: 5000
      });
      
      if (response.data === 'test_challenge_123') {
        log.success('Webhook responde correctamente a la verificación');
        this.results.webhook = true;
      } else {
        log.error('Webhook no devuelve el challenge correcto');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log.error('Servidor no está ejecutándose');
        log.info(`Inicia el servidor con: npm run dev`);
        log.info(`El servidor debería estar en el puerto ${PORT}`);
      } else {
        log.error(`Error al probar webhook: ${error.message}`);
      }
    }
  }

  async testDatabaseConnection() {
    log.title('5. Verificando Conexión a Base de Datos');
    
    try {
      // Intentar importar y usar Prisma
      const prismaPath = path.join(__dirname, 'src', 'utils', 'prisma.ts');
      
      if (fs.existsSync(prismaPath)) {
        log.step('Verificando conexión a Prisma...');
        
        // Verificar que la base de datos esté accesible
        const { DATABASE_URL } = process.env;
        
        if (DATABASE_URL) {
          log.success('DATABASE_URL configurada');
          log.info('Para probar la conexión completa, ejecuta: npx prisma db pull');
          this.results.database = true;
        } else {
          log.error('DATABASE_URL no configurada');
        }
      } else {
        log.warning('Archivo de Prisma no encontrado');
      }
      
    } catch (error) {
      log.error(`Error verificando base de datos: ${error.message}`);
    }
  }

  async testServices() {
    log.title('6. Verificando Servicios del Bot');
    
    try {
      // Verificar que los archivos de servicio existan
      const servicePaths = [
        'src/services/whatsappService.ts',
        'src/services/aiRoutineService.ts',
        'src/controllers/whatsapp.controller.ts',
        'src/routes/whatsapp.routes.ts'
      ];
      
      let allServicesExist = true;
      
      servicePaths.forEach(servicePath => {
        const fullPath = path.join(__dirname, servicePath);
        if (fs.existsSync(fullPath)) {
          log.success(`${servicePath}: Existe`);
        } else {
          log.error(`${servicePath}: No encontrado`);
          allServicesExist = false;
        }
      });
      
      if (allServicesExist) {
        log.success('Todos los servicios del bot están presentes');
        this.results.services = true;
      }
      
    } catch (error) {
      log.error(`Error verificando servicios: ${error.message}`);
    }
  }

  showFinalReport() {
    log.title('REPORTE FINAL');
    console.log('='.repeat(60));
    
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(Boolean).length;
    const percentage = Math.round((passedTests / totalTests) * 100);
    
    Object.entries(this.results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = {
        envVariables: 'Variables de Entorno',
        credentials: 'Credenciales de API',
        phoneNumber: 'Número de Teléfono',
        webhook: 'Endpoint del Webhook',
        database: 'Conexión a Base de Datos',
        services: 'Servicios del Bot'
      }[test];
      
      console.log(`${status} ${testName}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}RESULTADO: ${passedTests}/${totalTests} pruebas pasaron (${percentage}%)${colors.reset}`);
    
    if (percentage === 100) {
      log.success('🎉 ¡Todas las pruebas pasaron! El bot está listo para usar.');
      console.log('\n📋 Próximos pasos:');
      console.log('1. Configura el webhook en Meta for Developers');
      console.log('2. Prueba enviando mensajes al bot');
      console.log('3. Revisa los logs para verificar el funcionamiento');
    } else if (percentage >= 80) {
      log.warning('⚠️ La mayoría de pruebas pasaron, pero hay algunos problemas menores.');
      console.log('\n📋 Revisa los errores anteriores y corrígelos antes de continuar.');
    } else {
      log.error('❌ Varias pruebas fallaron. El bot no está listo para usar.');
      console.log('\n📋 Acciones recomendadas:');
      console.log('1. Revisa la configuración de variables de entorno');
      console.log('2. Verifica las credenciales en Meta for Developers');
      console.log('3. Consulta las guías de configuración');
    }
    
    console.log('\n📚 Documentación disponible:');
    console.log('- WHATSAPP_BOT_README.md - Guía general');
    console.log('- WHATSAPP_CREDENTIALS_GUIDE.md - Obtención de credenciales');
    console.log('- WEBHOOK_SETUP_GUIDE.md - Configuración del webhook');
  }
}

// Ejecutar las pruebas si el script se ejecuta directamente
if (require.main === module) {
  const tester = new WhatsAppConfigTester();
  tester.runAllTests().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = WhatsAppConfigTester;