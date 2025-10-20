"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const authenticateToken_1 = require("../middleware/authenticateToken");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Obtener recordatorios del usuario
router.get('/', authenticateToken_1.authenticateToken, async (req, res) => {
    try {
        const reminders = await prisma.reminder.findMany({
            where: { userId: req.user.id },
            orderBy: { reminderTime: 'asc' }
        });
        res.json({
            success: true,
            data: reminders
        });
    }
    catch (error) {
        console.error('Error al obtener recordatorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
// Crear nuevo recordatorio
router.post('/', authenticateToken_1.authenticateToken, async (req, res) => {
    try {
        const { title, message, reminderType, reminderTime, appointmentId } = req.body;
        const reminder = await prisma.reminder.create({
            data: {
                title,
                message,
                reminderType,
                reminderTime: new Date(reminderTime),
                userId: req.user.id,
                appointmentId: appointmentId || null
            }
        });
        res.status(201).json({
            success: true,
            data: reminder
        });
    }
    catch (error) {
        console.error('Error al crear recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
// Marcar recordatorio como enviado
router.patch('/:id/sent', authenticateToken_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const reminder = await prisma.reminder.update({
            where: {
                id,
                userId: req.user.id
            },
            data: {
                isSent: true
            }
        });
        res.json({
            success: true,
            data: reminder
        });
    }
    catch (error) {
        console.error('Error al actualizar recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
// Eliminar recordatorio
router.delete('/:id', authenticateToken_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reminder.delete({
            where: {
                id,
                userId: req.user.id
            }
        });
        res.json({
            success: true,
            message: 'Recordatorio eliminado exitosamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
exports.default = router;
