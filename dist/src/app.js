"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const responseHandler_1 = require("./utils/responseHandler");
// dotenv.config(); // ELIMINAR ESTA LÍNEA
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir solicitudes sin origin (aplicaciones móviles, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174'
        ];
        // Permitir cualquier IP de red local en puerto 5173 o 5174
        const localNetworkRegex = /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}:(5173|5174)$/;
        if (allowedOrigins.includes(origin) || localNetworkRegex.test(origin)) {
            callback(null, true);
        }
        else {
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
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Servir archivos estáticos desde el directorio uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
app.use('/api', routes_1.default);
// Middleware para rutas no encontradas
app.use(responseHandler_1.notFound);
// Registrar el middleware de error
app.use(responseHandler_1.errorHandler);
exports.default = app;
