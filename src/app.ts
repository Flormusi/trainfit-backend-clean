import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './routes';
import { errorHandler, notFound } from './utils/responseHandler';

// dotenv.config(); // ELIMINAR ESTA LÍNEA

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos por defecto (desarrollo local)
    const defaultAllowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];

    // Orígenes adicionales desde variables de entorno (separados por coma)
    const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const allowedOrigins = [...defaultAllowedOrigins, ...envAllowedOrigins];
    
    // Permitir cualquier IP de red local en puerto 5173 o 5174
    const localNetworkRegex = /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}:(5173|5174)$/;
    // Permitir dominios de Netlify (incluye sites y previews)
    const netlifyRegex = /^https?:\/\/([a-z0-9-]+\.)?netlify\.app$/i;
    // Permitir dominios de ngrok
    const ngrokRegex = /^https?:\/\/[a-z0-9-]+\.ngrok\.io$/i;
    // Permitir dominios de Vercel (deployments y previews)
const vercelRegex = /^https?:\/\/.*\.vercel\.app$/i;


    if (
  allowedOrigins.includes(origin) ||
  localNetworkRegex.test(origin) ||
  netlifyRegex.test(origin) ||
  ngrokRegex.test(origin) ||
  vercelRegex.test(origin)
) {

      callback(null, true);
    } else {
      console.log(`CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
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

// Rutas
app.use('/api', routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Registrar el middleware de error
app.use(errorHandler);

export default app;
