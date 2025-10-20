/**
 * Configuración para pruebas unitarias
 * Este archivo se ejecuta antes de todas las pruebas
 */

// Configurar variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_unit_tests';
process.env.PORT = '5001'; // Puerto diferente para pruebas

// Aumentar el tiempo de espera para operaciones asíncronas
jest.setTimeout(30000);

// Silenciar logs durante las pruebas
console.log = jest.fn();
console.info = jest.fn();
// Mantener errores y advertencias visibles para depuración
// console.error = jest.fn();
// console.warn = jest.fn();

// Configurar manejadores globales para promesas no capturadas
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED PROMISE REJECTION IN TESTS:', reason);
});

// Función de limpieza global después de todas las pruebas
afterAll(async () => {
  // Cerrar cualquier conexión o recurso abierto durante las pruebas
  // Ejemplo: await mongoose.disconnect();
  
  // Restaurar mocks
  jest.restoreAllMocks();
  
  // Limpiar variables de entorno modificadas
  delete process.env.JWT_SECRET;
});