"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const client_1 = require("@prisma/client");
const cronService_1 = require("./services/cronService");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
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
        const server = (0, http_1.createServer)(app_1.default);
        // Configurar Socket.IO
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: "http://localhost:5173", // URL del cliente
                methods: ["GET", "POST"]
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
        global.io = io;
        // Inicializar trabajos cron para recordatorios automáticos
        cronService_1.CronService.initializeCronJobs();
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} with WebSocket support`);
        });
    }
    catch (error) {
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
