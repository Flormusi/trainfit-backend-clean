import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { PrismaClient } from '@prisma/client';
import { CronService } from './services/cronService';

// Cargar .env según entorno (dev/staging/prod) con fallback a .env
(() => {
  const env = process.env.NODE_ENV || 'development';
  const envPath = `.env.${env}`;
  // Intentar cargar primero el archivo específico del entorno
  const loaded = dotenv.config({ path: envPath });
  if (loaded.error) {
    // Fallback al .env raíz si no existe el específico
    dotenv.config();
  }
})();


const prisma = new PrismaClient();
const PORT = process.env.PORT || 5004;

// // Connect to MongoDB // Eliminar este bloque completo
// const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/trainfit';
// mongoose.connect(mongoUri)
// .then(() => console.log('✅ Connected to MongoDB'))
// .catch(err => {
// console.error('❌ MongoDB connection error:', err);
// process.exit(1); // Salir si no se puede conectar a la BD
// });

async function main() {
  // Prisma Client se conecta automáticamente basado en DATABASE_URL en .env
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Prisma');
    console.log('🔄 Starting server with cron jobs and WebSocket support...');

    // Crear servidor HTTP
    const server = createServer(app);
    
    // Configurar Socket.IO con orígenes permitidos desde ALLOWED_ORIGINS
    const socketAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const defaultSocketOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];

    const io = new Server(server, {
      cors: {
        origin: socketAllowedOrigins.length ? socketAllowedOrigins : defaultSocketOrigins,
        credentials: true,
        methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH']
      }
    });

    // Configurar eventos de Socket.IO
    io.on('connection', (socket) => {
      console.log('🔌 Cliente conectado:', socket.id);
      
      // Unirse a sala específica del usuario
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 Usuario ${userId} se unió a su sala`);
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
      });
    });

    // Hacer io disponible globalmente para otros módulos
    (global as any).io = io;

    // Inicializar trabajos cron para recordatorios automáticos
    CronService.initializeCronJobs();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} with WebSocket support`);
    });

  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL via Prisma:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

// Opcional: Manejo de cierre elegante para Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Cron jobs initialized successfully - Email service fixed