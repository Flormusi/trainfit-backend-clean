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
exports.getAssignedWorkouts = exports.getAssignedRoutines = exports.createOrUpdateProfile = exports.getProfile = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Routine_1 = __importDefault(require("../models/Routine"));
const user_model_1 = __importDefault(require("../models/user.model")); // 👈 Importar el modelo de usuario
// ✅ Obtener perfil del cliente
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const client = yield Client_1.default.findOne({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
        if (!client) {
            res.status(404).json({ success: false, message: 'Perfil no encontrado' });
            return;
        }
        res.status(200).json({
            success: true,
            data: client
        });
    }
    catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
});
exports.getProfile = getProfile;
// ✅ Crear o actualizar perfil del cliente
const createOrUpdateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, phone, goals, measurements, healthInfo } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ success: false, message: 'ID de usuario faltante' });
            return;
        }
        if (!name) {
            res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
            return;
        }
        console.log('🧾 Datos recibidos para guardar perfil:', {
            name, phone, goals, measurements, healthInfo
        });
        const updatedProfile = yield Client_1.default.findOneAndUpdate({ user: userId }, {
            $set: {
                name,
                phone,
                goals,
                measurements,
                healthInfo,
                updatedAt: new Date()
            },
            $setOnInsert: {
                user: userId
            }
        }, {
            new: true,
            upsert: true,
            strict: false
        });
        // 👇 Actualizamos el estado del onboarding del usuario
        yield user_model_1.default.findByIdAndUpdate(userId, {
            hasCompletedOnboarding: true,
            hasCompletedProfile: true
        });
        res.status(200).json({
            success: true,
            data: updatedProfile,
            message: 'Perfil actualizado correctamente'
        });
    }
    catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
});
exports.createOrUpdateProfile = createOrUpdateProfile;
// ✅ Obtener rutinas asignadas
const getAssignedRoutines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const routines = yield Routine_1.default.find({ clientId: req.user.id });
        res.status(200).json({
            success: true,
            data: routines
        });
    }
    catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
});
exports.getAssignedRoutines = getAssignedRoutines;
// ✅ Obtener workouts asignados
const getAssignedWorkouts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workouts = yield Routine_1.default.find({ clientId: req.user.id });
        res.status(200).json({
            success: true,
            data: workouts
        });
    }
    catch (error) {
        console.error('Error al obtener workouts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
});
exports.getAssignedWorkouts = getAssignedWorkouts;
