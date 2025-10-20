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
exports.getClientProgress = void 0;
const Progress_1 = __importDefault(require("../models/Progress")); // 👈 Asegurate que tengas este modelo creado
// ✅ Get client progress
const getClientProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('🔎 Buscando progreso para cliente:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const progress = yield Progress_1.default.find({ clientId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        console.error('💥 Error al obtener progreso:', error.message || error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClientProgress = getClientProgress;
