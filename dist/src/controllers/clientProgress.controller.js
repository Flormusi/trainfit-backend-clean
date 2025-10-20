"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientProgress = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ✅ Get client progress
const getClientProgress = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        console.log('🔎 Buscando progreso para cliente:', req.user.id);
        const progress = await prisma.progress.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' },
            include: {
                routine: true
            }
        });
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
};
exports.getClientProgress = getClientProgress;
