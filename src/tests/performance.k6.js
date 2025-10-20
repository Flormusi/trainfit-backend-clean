/**
 * Pruebas de rendimiento para la API de TrainFit utilizando k6
 * 
 * Este script utiliza k6 (https://k6.io/) para realizar pruebas de rendimiento
 * más avanzadas que las pruebas de carga básicas.
 * 
 * Para ejecutar estas pruebas, primero debes instalar k6:
 * - macOS: brew install k6
 * - Linux: https://k6.io/docs/getting-started/installation/
 * - Windows: https://k6.io/docs/getting-started/installation/
 * 
 * Luego ejecuta: k6 run performance.k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Métricas personalizadas
const failRate = new Rate('failed_requests');
const dashboardTrend = new Trend('dashboard_response_time');
const clientsTrend = new Trend('clients_response_time');
const exercisesTrend = new Trend('exercises_response_time');
const routinesTrend = new Trend('routines_response_time');
const analyticsTrend = new Trend('analytics_response_time');

// Configuración de la prueba
export const options = {
  // Escenario 1: Prueba de carga constante
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      gracefulStop: '5s',
    },
    // Escenario 2: Prueba de rampa (incremento gradual de usuarios)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
    // Escenario 3: Prueba de estrés (picos de carga)
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 1 },
      ],
    },
  },
  thresholds: {
    // Umbrales para considerar la prueba exitosa
    'failed_requests': ['rate<0.1'], // Menos del 10% de solicitudes fallidas
    'http_req_duration': ['p(95)<500'], // 95% de las solicitudes deben completarse en menos de 500ms
    'dashboard_response_time': ['avg<200'], // Tiempo promedio para el dashboard menor a 200ms
    'clients_response_time': ['avg<300'], // Tiempo promedio para clientes menor a 300ms
    'exercises_response_time': ['avg<300'], // Tiempo promedio para ejercicios menor a 300ms
    'routines_response_time': ['avg<400'], // Tiempo promedio para rutinas menor a 400ms
    'analytics_response_time': ['avg<500'], // Tiempo promedio para analíticas menor a 500ms
  },
};

// Cargar token de autenticación (debe existir previamente)
const getToken = () => {
  // En un entorno real, esto podría leer el token de un archivo
  // Para esta prueba, usamos un token de ejemplo
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE1MTYyMzkwMjJ9.L8i6g3PfcHlioHCCPURC9pmXT7gdJpx3kOoyAfNUwCc';
};

// Configuración base para las solicitudes HTTP
const baseParams = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  },
};

// URL base de la API
const BASE_URL = 'http://localhost:5000/api';

// Función para generar datos aleatorios para pruebas
const generateRandomData = () => {
  return {
    // Datos para crear cliente
    client: {
      name: `Cliente Test ${Math.floor(Math.random() * 1000)}`,
      email: `cliente${Math.floor(Math.random() * 10000)}@test.com`,
      phone: `${Math.floor(Math.random() * 1000000000)}`,
      goals: 'Perder peso',
      weight: Math.floor(60 + Math.random() * 40),
      initialObjective: 'Tonificar',
      trainingDaysPerWeek: Math.floor(2 + Math.random() * 5),
    },
    // Datos para crear ejercicio
    exercise: {
      name: `Ejercicio Test ${Math.floor(Math.random() * 1000)}`,
      description: 'Descripción del ejercicio de prueba',
      type: randomItem(['Fuerza', 'Cardio', 'Flexibilidad', 'Equilibrio']),
      difficulty: randomItem(['Principiante', 'Intermedio', 'Avanzado']),
      equipment: randomItem(['Mancuernas', 'Bandas', 'Peso corporal', 'Máquina']),
      muscles: ['Pecho', 'Hombros'],
    },
  };
};

// Función principal que se ejecuta para cada usuario virtual
export default function () {
  const randomData = generateRandomData();
  
  // Grupo 1: Pruebas de autenticación
  group('Autenticación', () => {
    // Verificar estado de autenticación
    const profileRes = http.get(`${BASE_URL}/trainer/profile`, baseParams);
    
    check(profileRes, {
      'Autenticación exitosa': (r) => r.status === 200,
    }) || failRate.add(1);
    
    sleep(1);
  });
  
  // Grupo 2: Pruebas del Dashboard
  group('Dashboard', () => {
    const dashboardStartTime = new Date().getTime();
    const dashboardRes = http.get(`${BASE_URL}/trainer/dashboard`, baseParams);
    const dashboardDuration = new Date().getTime() - dashboardStartTime;
    
    dashboardTrend.add(dashboardDuration);
    
    check(dashboardRes, {
      'Dashboard carga correctamente': (r) => r.status === 200,
      'Dashboard contiene datos esperados': (r) => {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('clientCount') && 
               body.hasOwnProperty('routineCount') && 
               body.hasOwnProperty('exerciseCount');
      },
    }) || failRate.add(1);
    
    sleep(1);
  });
  
  // Grupo 3: Pruebas de Clientes
  group('Clientes', () => {
    // Obtener lista de clientes
    const clientsStartTime = new Date().getTime();
    const clientsRes = http.get(`${BASE_URL}/trainer/clients`, baseParams);
    const clientsDuration = new Date().getTime() - clientsStartTime;
    
    clientsTrend.add(clientsDuration);
    
    check(clientsRes, {
      'Lista de clientes carga correctamente': (r) => r.status === 200,
      'Lista de clientes tiene formato correcto': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true && 
               Array.isArray(body.data.clients) && 
               body.data.hasOwnProperty('pagination');
      },
    }) || failRate.add(1);
    
    // Crear un nuevo cliente (solo en algunas iteraciones para no saturar la BD)
    if (Math.random() < 0.2) { // 20% de probabilidad
      const createClientRes = http.post(
        `${BASE_URL}/trainer/clients`,
        JSON.stringify(randomData.client),
        baseParams
      );
      
      check(createClientRes, {
        'Cliente creado correctamente': (r) => r.status === 201,
      }) || failRate.add(1);
    }
    
    sleep(1);
  });
  
  // Grupo 4: Pruebas de Ejercicios
  group('Ejercicios', () => {
    // Obtener lista de ejercicios
    const exercisesStartTime = new Date().getTime();
    const exercisesRes = http.get(`${BASE_URL}/trainer/exercises`, baseParams);
    const exercisesDuration = new Date().getTime() - exercisesStartTime;
    
    exercisesTrend.add(exercisesDuration);
    
    check(exercisesRes, {
      'Lista de ejercicios carga correctamente': (r) => r.status === 200,
      'Lista de ejercicios tiene formato correcto': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true && 
               Array.isArray(body.data.exercises) && 
               body.data.hasOwnProperty('pagination');
      },
    }) || failRate.add(1);
    
    // Crear un nuevo ejercicio (solo en algunas iteraciones)
    if (Math.random() < 0.1) { // 10% de probabilidad
      const createExerciseRes = http.post(
        `${BASE_URL}/trainer/exercises`,
        JSON.stringify(randomData.exercise),
        baseParams
      );
      
      check(createExerciseRes, {
        'Ejercicio creado correctamente': (r) => r.status === 201,
      }) || failRate.add(1);
    }
    
    sleep(1);
  });
  
  // Grupo 5: Pruebas de Rutinas
  group('Rutinas', () => {
    // Obtener lista de rutinas
    const routinesStartTime = new Date().getTime();
    const routinesRes = http.get(`${BASE_URL}/trainer/routines`, baseParams);
    const routinesDuration = new Date().getTime() - routinesStartTime;
    
    routinesTrend.add(routinesDuration);
    
    check(routinesRes, {
      'Lista de rutinas carga correctamente': (r) => r.status === 200,
      'Lista de rutinas tiene formato correcto': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true && 
               Array.isArray(body.data.routines) && 
               body.data.hasOwnProperty('pagination');
      },
    }) || failRate.add(1);
    
    sleep(1);
  });
  
  // Grupo 6: Pruebas de Analíticas
  group('Analíticas', () => {
    // Obtener analíticas
    const analyticsStartTime = new Date().getTime();
    const analyticsRes = http.get(`${BASE_URL}/trainer/analytics`, baseParams);
    const analyticsDuration = new Date().getTime() - analyticsStartTime;
    
    analyticsTrend.add(analyticsDuration);
    
    check(analyticsRes, {
      'Analíticas cargan correctamente': (r) => r.status === 200,
      'Analíticas tienen formato correcto': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true && 
               body.data.hasOwnProperty('routinesCreated') && 
               body.data.hasOwnProperty('newClients') && 
               body.data.hasOwnProperty('progressUpdates');
      },
    }) || failRate.add(1);
    
    // Probar analíticas con parámetros
    const analyticsWithParamsRes = http.get(
      `${BASE_URL}/trainer/analytics?period=month`,
      baseParams
    );
    
    check(analyticsWithParamsRes, {
      'Analíticas con parámetros cargan correctamente': (r) => r.status === 200,
    }) || failRate.add(1);
    
    sleep(1);
  });
  
  // Pausa entre iteraciones para simular comportamiento de usuario real
  sleep(Math.random() * 3 + 1); // Pausa aleatoria entre 1 y 4 segundos
}