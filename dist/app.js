"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const exercise_routes_1 = __importDefault(require("./routes/exercise.routes"));
const workout_routes_1 = __importDefault(require("./routes/workout.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const progress_routes_1 = __importDefault(require("./routes/progress.routes"));
const clientProfile_routes_1 = __importDefault(require("./routes/clientProfile.routes")); // ✅ NUEVA LÍNEA
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://ef28-2800-2222-0-1db3-9570-7dc4-f82a-629d.ngrok-free.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Flor-Signature']
}));
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/exercises', exercise_routes_1.default);
app.use('/api/workouts', workout_routes_1.default);
app.use('/api/clients', clientProfile_routes_1.default); // primero
app.use('/api/clients', client_routes_1.default); // después
; // ✅ AÑADIDO AQUÍ
app.use('/api/progress', progress_routes_1.default);
// Root route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to TrainFit API' });
});
// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
exports.default = app;
