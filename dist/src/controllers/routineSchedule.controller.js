"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoutineSchedule = exports.updateRoutineSchedule = exports.createRoutineSchedule = exports.getRoutineSchedules = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET /api/routine-schedule - Obtener todas las rutinas programadas
const getRoutineSchedules = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Obtener citas/rutinas programadas del usuario
        const routineSchedules = await prisma.appointment.findMany({
            where: {
                OR: [
                    { trainerId: userId },
                    { clientId: userId }
                ]
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        res.json(routineSchedules);
    }
    catch (error) {
        console.error('Error obteniendo rutinas programadas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getRoutineSchedules = getRoutineSchedules;
// POST /api/routine-schedule - Crear nueva rutina programada
const createRoutineSchedule = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, startTime, endTime, clientId, location, notes } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Validar campos requeridos
        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                message: 'Faltan campos requeridos: title, startTime, endTime'
            });
        }
        // Crear la cita/rutina programada
        const routineSchedule = await prisma.appointment.create({
            data: {
                title,
                description: description || '',
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                trainerId: userId,
                clientId: clientId || userId,
                location: location || '',
                notes: notes || ''
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json(routineSchedule);
    }
    catch (error) {
        console.error('Error creando rutina programada:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createRoutineSchedule = createRoutineSchedule;
// PUT /api/routine-schedule/:id - Actualizar rutina programada
const updateRoutineSchedule = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { title, description, startTime, endTime, clientId, location, notes } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Verificar que la cita existe y pertenece al usuario
        const existingSchedule = await prisma.appointment.findFirst({
            where: {
                id,
                OR: [
                    { trainerId: userId },
                    { clientId: userId }
                ]
            }
        });
        if (!existingSchedule) {
            return res.status(404).json({ message: 'Rutina programada no encontrada' });
        }
        // Actualizar la cita/rutina programada
        const updatedSchedule = await prisma.appointment.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(startTime && { startTime: new Date(startTime) }),
                ...(endTime && { endTime: new Date(endTime) }),
                ...(clientId !== undefined && { clientId }),
                ...(location !== undefined && { location }),
                ...(notes !== undefined && { notes })
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json(updatedSchedule);
    }
    catch (error) {
        console.error('Error actualizando rutina programada:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateRoutineSchedule = updateRoutineSchedule;
// DELETE /api/routine-schedule/:id - Eliminar rutina programada
const deleteRoutineSchedule = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Verificar que la cita existe y pertenece al usuario
        const existingSchedule = await prisma.appointment.findFirst({
            where: {
                id,
                OR: [
                    { trainerId: userId },
                    { clientId: userId }
                ]
            }
        });
        if (!existingSchedule) {
            return res.status(404).json({ message: 'Rutina programada no encontrada' });
        }
        // Eliminar la cita/rutina programada
        await prisma.appointment.delete({
            where: { id }
        });
        res.json({ message: 'Rutina programada eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error eliminando rutina programada:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.deleteRoutineSchedule = deleteRoutineSchedule;
