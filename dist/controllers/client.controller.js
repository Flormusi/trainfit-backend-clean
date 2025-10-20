"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientDashboardProgress = exports.getClientDashboardData = exports.getClientRoutines = exports.getClientWorkouts = exports.getClientStats = exports.updateClientStatus = exports.addClientProgress = exports.getClientProgress = exports.assignWorkout = exports.updateClientNotes = exports.getClient = exports.getClients = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const profile_model_1 = __importDefault(require("../models/profile.model"));
const workout_model_1 = __importDefault(require("../models/workout.model"));
const clientNote_model_1 = __importDefault(require("../models/clientNote.model"));
const progress_model_1 = __importDefault(require("../models/progress.model"));
// @desc    Get all clients for a trainer
// @route   GET /api/clients
// @access  Private/Trainer
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all users with role 'client'
        const clients = yield user_model_1.default.find({ role: 'client' }).select('-password');
        // Get their profiles
        const clientProfiles = yield Promise.all(clients.map((client) => __awaiter(void 0, void 0, void 0, function* () {
            const profile = yield profile_model_1.default.findOne({ user: client._id });
            const notes = yield clientNote_model_1.default.find({
                client: client._id,
                trainer: req.user.id
            }).sort({ createdAt: -1 });
            return {
                user: client,
                profile: profile || null,
                notes: notes || []
            };
        })));
        res.status(200).json({
            success: true,
            count: clientProfiles.length,
            data: clientProfiles
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClients = getClients;
// @desc    Get single client
// @route   GET /api/clients/:clientId
// @access  Private/Trainer
const getClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield user_model_1.default.findById(req.params.clientId).select('-password');
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        const profile = yield profile_model_1.default.findOne({ user: client._id });
        const notes = yield clientNote_model_1.default.find({
            client: client._id,
            trainer: req.user.id
        }).sort({ createdAt: -1 });
        const assignedWorkouts = yield workout_model_1.default.find({
            assignedTo: client._id
        }).populate('exercises.exercise', 'name');
        const progress = yield progress_model_1.default.find({
            user: client._id
        }).sort({ date: -1 }).limit(10);
        res.status(200).json({
            success: true,
            data: {
                user: client,
                profile: profile || null,
                notes: notes || [],
                workouts: assignedWorkouts || [],
                progress: progress || []
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClient = getClient;
// @desc    Update client notes
// @route   PUT /api/clients/:clientId/notes
// @access  Private/Trainer
const updateClientNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide note content'
            });
        }
        // Check if client exists
        const client = yield user_model_1.default.findById(req.params.clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        const note = yield clientNote_model_1.default.create({
            client: req.params.clientId,
            trainer: req.user.id,
            content
        });
        res.status(201).json({
            success: true,
            data: note
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.updateClientNotes = updateClientNotes;
// @desc    Assign workout to client
// @route   POST /api/clients/:clientId/workouts/:workoutId
// @access  Private/Trainer
const assignWorkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { clientId, workoutId } = req.params;
        // Check if client exists
        const client = yield user_model_1.default.findById(clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        // Check if workout exists
        const workout = yield workout_model_1.default.findById(workoutId);
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        // Make sure user is workout creator or admin
        if (workout.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to assign this workout'
            });
        }
        // Check if workout is already assigned to this client
        if ((_a = workout.assignedTo) === null || _a === void 0 ? void 0 : _a.some(id => id.toString() === clientId)) {
            return res.status(400).json({
                success: false,
                message: 'Workout already assigned to this client'
            });
        }
        // Assign workout to client
        if (!workout.assignedTo) {
            workout.assignedTo = [clientId]; // Use type assertion to avoid type errors
        }
        else {
            workout.assignedTo.push(clientId); // Use type assertion to avoid type errors
        }
        yield workout.save();
        res.status(200).json({
            success: true,
            data: workout
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.assignWorkout = assignWorkout;
// @desc    Get client progress
// @route   GET /api/clients/:clientId/progress
// @access  Private/Trainer
const getClientProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if client exists
        const client = yield user_model_1.default.findById(req.params.clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        const progress = yield progress_model_1.default.find({
            user: req.params.clientId
        }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: progress.length,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClientProgress = getClientProgress;
// @desc    Add progress record for a client
// @route   POST /api/clients/:clientId/progress
// @access  Private/Trainer
const addClientProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.params;
        // Check if client exists
        const client = yield user_model_1.default.findById(clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        // Create progress record
        const progressData = Object.assign(Object.assign({}, req.body), { user: clientId, date: req.body.date || new Date() });
        const progress = yield progress_model_1.default.create(progressData);
        res.status(201).json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.addClientProgress = addClientProgress;
// @desc    Update client status (active/inactive)
// @route   PUT /api/clients/:clientId/status
// @access  Private/Trainer
const updateClientStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.params;
        const { status } = req.body;
        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid status (active/inactive)'
            });
        }
        // Check if client exists
        const client = yield user_model_1.default.findById(clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }
        // Update client status
        client.status = status;
        yield client.save();
        res.status(200).json({
            success: true,
            data: {
                id: client._id,
                name: client.name,
                email: client.email,
                status: client.status
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.updateClientStatus = updateClientStatus;
// @desc    Get client stats for dashboard
// @route   GET /api/clients/stats
// @access  Private (client, trainer)
const getClientStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener el ID del usuario actual
        const userId = req.user._id;
        // Obtener registros de progreso del cliente
        const progressRecords = yield progress_model_1.default.find({ user: userId }).sort({ date: 1 });
        // Obtener entrenamientos asignados
        const workouts = yield workout_model_1.default.find({ assignedTo: userId });
        // Calcular estadísticas
        const initialWeight = progressRecords.length > 0 ? progressRecords[0].weight : 0;
        const currentWeight = progressRecords.length > 0 ? progressRecords[progressRecords.length - 1].weight : 0;
        const weightChange = (currentWeight || 0) - (initialWeight || 0);
        // Calcular cambio de grasa corporal si está disponible
        let bodyFatChange = null;
        if (progressRecords.length > 0 &&
            progressRecords[0].bodyFat !== undefined &&
            progressRecords[progressRecords.length - 1].bodyFat !== undefined) {
            bodyFatChange = progressRecords[progressRecords.length - 1].bodyFat - progressRecords[0].bodyFat;
        }
        // Calcular estadísticas de entrenamiento
        const totalWorkouts = workouts.length;
        res.status(200).json({
            success: true,
            data: {
                progressRecordCount: progressRecords.length,
                initialWeight,
                currentWeight,
                weightChange,
                bodyFatChange,
                totalWorkouts,
                lastProgressUpdate: progressRecords.length > 0 ? progressRecords[progressRecords.length - 1].date : null
            }
        });
    }
    catch (error) {
        console.error('Error al obtener estadísticas del cliente:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
});
exports.getClientStats = getClientStats;
// @desc    Get client workouts
// @route   GET /api/clients/workouts
// @access  Private (client, trainer)
const getClientWorkouts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Por ahora, devolvemos una respuesta de marcador de posición
        res.status(200).json({
            success: true,
            data: [],
            message: 'Entrenamientos del cliente obtenidos con éxito'
        });
    }
    catch (error) {
        console.error('Error al obtener los entrenamientos del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener los entrenamientos del cliente'
        });
    }
});
exports.getClientWorkouts = getClientWorkouts;
// @desc    Get client routines
// @route   GET /api/clients/routines
// @access  Private (client, trainer)
const getClientRoutines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Por ahora, devolvemos una respuesta de marcador de posición
        res.status(200).json({
            success: true,
            data: [],
            message: 'Rutinas del cliente obtenidas con éxito'
        });
    }
    catch (error) {
        console.error('Error al obtener las rutinas del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener las rutinas del cliente'
        });
    }
});
exports.getClientRoutines = getClientRoutines;
// @desc    Get client dashboard data
// @route   GET /api/clients/dashboard
// @access  Private (client, trainer)
const getClientDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Por ahora, devolvemos una respuesta de marcador de posición
        res.status(200).json({
            success: true,
            data: {
                recentWorkouts: [],
                upcomingWorkouts: [],
                progressStats: {}
            },
            message: 'Datos del dashboard del cliente obtenidos con éxito'
        });
    }
    catch (error) {
        console.error('Error al obtener los datos del dashboard del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener los datos del dashboard del cliente'
        });
    }
});
exports.getClientDashboardData = getClientDashboardData;
// @desc    Get client progress for dashboard
// @route   GET /api/clients/progress
// @access  Private (client, trainer)
const getClientDashboardProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Aquí implementarías la lógica para obtener el progreso del cliente
        // Por ahora, devolvemos datos de ejemplo
        res.status(200).json({
            success: true,
            data: {
                weightProgress: [
                    { date: '2023-01-01', value: 75 },
                    { date: '2023-02-01', value: 74 },
                    { date: '2023-03-01', value: 73 },
                    { date: '2023-04-01', value: 72 }
                ],
                workoutCompletionRate: 85,
                attendanceRate: 90,
                goals: [
                    { name: 'Perder peso', progress: 60, target: 100 },
                    { name: 'Aumentar resistencia', progress: 75, target: 100 }
                ]
            },
            message: 'Datos de progreso del cliente obtenidos con éxito'
        });
    }
    catch (error) {
        console.error('Error al obtener el progreso del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el progreso del cliente'
        });
    }
});
exports.getClientDashboardProgress = getClientDashboardProgress;
