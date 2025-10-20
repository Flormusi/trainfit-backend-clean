/**
 * Pruebas unitarias para la API de TrainFit
 * Este archivo contiene pruebas para verificar el correcto funcionamiento
 * de los endpoints de la API.
 */

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Token de prueba para autenticación
let testToken;
// ID de usuario de prueba
let testUserId;
// ID de cliente de prueba
let testClientId;
// ID de ejercicio de prueba
let testExerciseId;
// ID de rutina de prueba
let testRoutineId;

// Configuración antes de todas las pruebas
beforeAll(async () => {
  // Crear un usuario de prueba (entrenador)
  const testUser = await prisma.user.create({
    data: {
      name: 'Entrenador de Prueba',
      email: 'test.trainer@example.com',
      password: '$2a$10$XFDEWGb.cVXffkwNJxe4/.UBCiGXY5Goz0Dh.qOgHXXJQJgvZlsIO', // 'password123' hasheado
      role: 'TRAINER'
    }
  });
  
  testUserId = testUser.id;
  
  // Generar token JWT para el usuario de prueba
  testToken = jwt.sign(
    { id: testUserId },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  // Eliminar datos de prueba
  if (testRoutineId) {
    await prisma.routine.delete({ where: { id: testRoutineId } }).catch(() => {});
  }
  
  if (testExerciseId) {
    await prisma.exercise.delete({ where: { id: testExerciseId } }).catch(() => {});
  }
  
  if (testClientId) {
    await prisma.user.delete({ where: { id: testClientId } }).catch(() => {});
  }
  
  if (testUserId) {
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  }
  
  // Cerrar conexión de Prisma
  await prisma.$disconnect();
});

// Grupo de pruebas para autenticación
describe('Autenticación', () => {
  // Prueba para el endpoint de login
  test('POST /api/auth/login - Login exitoso', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.trainer@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
  
  // Prueba para el endpoint de login con credenciales incorrectas
  test('POST /api/auth/login - Credenciales incorrectas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.trainer@example.com',
        password: 'contraseña_incorrecta'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

// Grupo de pruebas para el dashboard
describe('Dashboard', () => {
  // Prueba para el endpoint de obtener datos del dashboard
  test('GET /api/trainer/dashboard - Obtener datos del dashboard', async () => {
    const response = await request(app)
      .get('/api/trainer/dashboard')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clientCount');
    expect(response.body).toHaveProperty('routineCount');
    expect(response.body).toHaveProperty('exerciseCount');
  });
  
  // Prueba para el endpoint de obtener datos del dashboard sin autenticación
  test('GET /api/trainer/dashboard - Sin autenticación', async () => {
    const response = await request(app)
      .get('/api/trainer/dashboard');
    
    expect(response.status).toBe(401);
  });
});

// Grupo de pruebas para ejercicios
describe('Ejercicios', () => {
  // Prueba para crear un nuevo ejercicio
  test('POST /api/trainer/exercises - Crear ejercicio', async () => {
    const exerciseData = {
      name: 'Ejercicio de Prueba',
      description: 'Descripción del ejercicio de prueba',
      type: 'Fuerza',
      difficulty: 'Intermedio',
      equipment: 'Mancuernas',
      muscles: ['Pecho', 'Hombros']
    };
    
    const response = await request(app)
      .post('/api/trainer/exercises')
      .set('Authorization', `Bearer ${testToken}`)
      .send(exerciseData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(exerciseData.name);
    
    // Guardar ID para pruebas posteriores
    testExerciseId = response.body.data.id;
  });
  
  // Prueba para obtener ejercicios
  test('GET /api/trainer/exercises - Obtener ejercicios', async () => {
    const response = await request(app)
      .get('/api/trainer/exercises')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.exercises)).toBe(true);
    expect(response.body.data.pagination).toBeDefined();
  });
  
  // Prueba para actualizar un ejercicio
  test('PUT /api/trainer/exercises/:id - Actualizar ejercicio', async () => {
    const updateData = {
      name: 'Ejercicio Actualizado',
      description: 'Descripción actualizada'
    };
    
    const response = await request(app)
      .put(`/api/trainer/exercises/${testExerciseId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
  });
});

// Grupo de pruebas para clientes
describe('Clientes', () => {
  // Prueba para crear un nuevo cliente
  test('POST /api/trainer/clients - Crear cliente', async () => {
    const clientData = {
      name: 'Cliente de Prueba',
      email: 'test.client@example.com',
      password: 'password123',
      phone: '123456789',
      goals: 'Perder peso',
      weight: 75,
      initialObjective: 'Tonificar',
      trainingDaysPerWeek: 3
    };
    
    const response = await request(app)
      .post('/api/trainer/clients')
      .set('Authorization', `Bearer ${testToken}`)
      .send(clientData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(clientData.name);
    
    // Guardar ID para pruebas posteriores
    testClientId = response.body.data.id;
  });
  
  // Prueba para obtener clientes
  test('GET /api/trainer/clients - Obtener clientes', async () => {
    const response = await request(app)
      .get('/api/trainer/clients')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.clients)).toBe(true);
    expect(response.body.data.pagination).toBeDefined();
  });
  
  // Prueba para obtener detalles de un cliente
  test('GET /api/trainer/clients/:id - Obtener detalles de cliente', async () => {
    const response = await request(app)
      .get(`/api/trainer/clients/${testClientId}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testClientId);
  });
});

// Grupo de pruebas para rutinas
describe('Rutinas', () => {
  // Prueba para crear una nueva rutina
  test('POST /api/trainer/routines - Crear rutina', async () => {
    const routineData = {
      name: 'Rutina de Prueba',
      description: 'Descripción de la rutina de prueba',
      clientId: testClientId,
      exercises: [
        {
          id: testExerciseId,
          name: 'Ejercicio Actualizado',
          sets: 3,
          reps: 12,
          weight: 10,
          notes: 'Notas de prueba'
        }
      ]
    };
    
    const response = await request(app)
      .post('/api/trainer/routines')
      .set('Authorization', `Bearer ${testToken}`)
      .send(routineData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(routineData.name);
    
    // Guardar ID para pruebas posteriores
    testRoutineId = response.body.data.id;
  });
  
  // Prueba para obtener rutinas
  test('GET /api/trainer/routines - Obtener rutinas', async () => {
    const response = await request(app)
      .get('/api/trainer/routines')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.routines)).toBe(true);
    expect(response.body.data.pagination).toBeDefined();
  });
  
  // Prueba para obtener detalles de una rutina
  test('GET /api/trainer/routines/:id - Obtener detalles de rutina', async () => {
    const response = await request(app)
      .get(`/api/trainer/routines/${testRoutineId}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testRoutineId);
  });
});

// Grupo de pruebas para analíticas
describe('Analíticas', () => {
  // Prueba para obtener analíticas
  test('GET /api/trainer/analytics - Obtener analíticas', async () => {
    const response = await request(app)
      .get('/api/trainer/analytics')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('routinesCreated');
    expect(response.body.data).toHaveProperty('newClients');
    expect(response.body.data).toHaveProperty('progressUpdates');
  });
  
  // Prueba para obtener analíticas con período específico
  test('GET /api/trainer/analytics?period=month - Obtener analíticas por período', async () => {
    const response = await request(app)
      .get('/api/trainer/analytics?period=month')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.period).toBe('month');
  });
});