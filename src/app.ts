import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './routes';
import { errorHandler, notFound } from './utils/responseHandler';

// dotenv.config(); // ELIMINAR ESTA LÍNEA

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://trainfit.vercel.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos desde el directorio uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de logging para todas las solicitudes
app.use((req, res, next) => {
  console.log(`\n=== SOLICITUD ENTRANTE ===`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Ruta completa: ${req.originalUrl}`);
  console.log(`Parámetros de consulta:`, req.query);
  console.log(`Parámetros de ruta:`, req.params);
  console.log('Headers:', req.headers);
  console.log(`=========================\n`);
  next();
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Trainfit' });
});

// Health check para keep-alive (Render free tier)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas
app.use('/api', routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Registrar el middleware de error
app.use(errorHandler);

export default app;
