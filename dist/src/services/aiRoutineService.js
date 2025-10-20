"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRoutineService = exports.aiRoutineService = void 0;
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../utils/prisma"));
class AIRoutineService {
    constructor() {
        // Constructor simplificado - implementaremos IA más adelante
    }
    /**
     * Procesa un mensaje de texto para extraer el objetivo de entrenamiento
     * Por ahora usa lógica simple, después se integrará con IA
     */
    async processTrainingObjective(message) {
        try {
            const lowerMessage = message.toLowerCase();
            // Detectar objetivo principal
            let goal = 'tonificar'; // default
            if (lowerMessage.includes('perder peso') || lowerMessage.includes('adelgazar')) {
                goal = 'perder peso';
            }
            else if (lowerMessage.includes('masa muscular') || lowerMessage.includes('volumen')) {
                goal = 'ganar masa muscular';
            }
            else if (lowerMessage.includes('fuerza')) {
                goal = 'ganar fuerza';
            }
            else if (lowerMessage.includes('resistencia') || lowerMessage.includes('cardio')) {
                goal = 'mejorar resistencia';
            }
            // Detectar nivel
            let level = 'intermediate';
            if (lowerMessage.includes('principiante') || lowerMessage.includes('novato')) {
                level = 'beginner';
            }
            else if (lowerMessage.includes('avanzado') || lowerMessage.includes('experto')) {
                level = 'advanced';
            }
            // Detectar frecuencia
            let frequency = 3; // default
            const frequencyMatch = lowerMessage.match(/(\d+)\s*(días?|veces?)\s*(por\s*semana|semana)/i);
            if (frequencyMatch) {
                frequency = parseInt(frequencyMatch[1]);
            }
            return {
                goal,
                level,
                duration: 4, // 4 semanas por defecto
                frequency,
                equipment: ['mancuernas', 'barra'], // equipamiento básico
                limitations: []
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing training objective', { error, message });
            return null;
        }
    }
    /**
     * Genera una rutina de ejercicios basada en el objetivo
     * Por ahora usa plantillas predefinidas, después se integrará con IA
     */
    async generateRoutine(objective) {
        try {
            // Obtener ejercicios disponibles de la base de datos
            const availableExercises = await prisma_1.default.exercise.findMany({
                select: {
                    name: true,
                    muscles: true,
                    description: true,
                    equipment: true
                }
            });
            if (availableExercises.length === 0) {
                logger_1.logger.warn('No exercises found in database');
                return null;
            }
            // Seleccionar ejercicios basados en el objetivo
            let selectedExercises = [];
            if (objective.goal === 'perder peso') {
                // Rutina para perder peso - más cardio y circuitos
                selectedExercises = this.selectExercisesForWeightLoss(availableExercises, objective.level);
            }
            else if (objective.goal === 'ganar masa muscular') {
                // Rutina para ganar masa - ejercicios compuestos y aislados
                selectedExercises = this.selectExercisesForMuscleGain(availableExercises, objective.level);
            }
            else if (objective.goal === 'ganar fuerza') {
                // Rutina para fuerza - ejercicios básicos con peso
                selectedExercises = this.selectExercisesForStrength(availableExercises, objective.level);
            }
            else {
                // Rutina general de tonificación
                selectedExercises = this.selectExercisesForToning(availableExercises, objective.level);
            }
            const routine = {
                name: `Rutina ${objective.goal} - ${objective.level}`,
                description: `Rutina personalizada para ${objective.goal} nivel ${objective.level}`,
                duration: `${objective.duration} semanas`,
                exercises: selectedExercises
            };
            return routine;
        }
        catch (error) {
            logger_1.logger.error('Error generating routine', { error, objective });
            return null;
        }
    }
    selectExercisesForWeightLoss(exercises, level) {
        // Seleccionar ejercicios que quemen más calorías
        const cardioExercises = exercises.filter(ex => ex.name.toLowerCase().includes('burpee') ||
            ex.name.toLowerCase().includes('jumping') ||
            ex.name.toLowerCase().includes('mountain'));
        const compoundExercises = exercises.filter(ex => ex.name.toLowerCase().includes('squat') ||
            ex.name.toLowerCase().includes('deadlift') ||
            ex.name.toLowerCase().includes('press')).slice(0, 4);
        return [...cardioExercises.slice(0, 3), ...compoundExercises].map(ex => ({
            name: ex.name,
            sets: level === 'beginner' ? 3 : 4,
            reps: level === 'beginner' ? '12-15' : '15-20',
            rest_seconds: 45,
            instructions: ex.description || 'Mantén buena forma durante todo el ejercicio',
            muscle_groups: ex.muscles || ['general']
        }));
    }
    selectExercisesForMuscleGain(exercises, level) {
        // Seleccionar ejercicios compuestos para masa muscular
        const compoundExercises = exercises.filter(ex => ex.name.toLowerCase().includes('squat') ||
            ex.name.toLowerCase().includes('deadlift') ||
            ex.name.toLowerCase().includes('press') ||
            ex.name.toLowerCase().includes('row')).slice(0, 6);
        return compoundExercises.map(ex => ({
            name: ex.name,
            sets: level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5,
            reps: level === 'beginner' ? '8-12' : '6-10',
            rest_seconds: level === 'beginner' ? 90 : 120,
            instructions: ex.description || 'Enfócate en la técnica y progresión de peso',
            muscle_groups: ex.muscles || ['general']
        }));
    }
    selectExercisesForStrength(exercises, level) {
        // Seleccionar ejercicios básicos para fuerza
        const strengthExercises = exercises.filter(ex => ex.name.toLowerCase().includes('squat') ||
            ex.name.toLowerCase().includes('deadlift') ||
            ex.name.toLowerCase().includes('bench') ||
            ex.name.toLowerCase().includes('press')).slice(0, 5);
        return strengthExercises.map(ex => ({
            name: ex.name,
            sets: level === 'beginner' ? 3 : 5,
            reps: level === 'beginner' ? '5-8' : '3-5',
            rest_seconds: level === 'beginner' ? 120 : 180,
            instructions: ex.description || 'Prioriza la técnica sobre el peso',
            muscle_groups: ex.muscles || ['general']
        }));
    }
    selectExercisesForToning(exercises, level) {
        // Rutina general balanceada
        const selectedExercises = exercises.slice(0, 8);
        return selectedExercises.map(ex => ({
            name: ex.name,
            sets: level === 'beginner' ? 3 : 4,
            reps: '10-15',
            rest_seconds: 60,
            instructions: ex.description || 'Mantén control en cada repetición',
            muscle_groups: ex.muscles || ['general']
        }));
    }
    /**
     * Crea la rutina en la base de datos
     */
    async saveRoutineToDatabase(routine, trainerId, clientId) {
        try {
            // Crear la rutina principal usando el esquema correcto
            const createdRoutine = await prisma_1.default.routine.create({
                data: {
                    name: routine.name,
                    description: routine.description,
                    duration: routine.duration,
                    trainerId: trainerId,
                    clientId: clientId || trainerId, // Si no hay cliente, asignar al trainer
                    exercises: routine.exercises, // Guardar como JSON
                    createdAt: new Date()
                }
            });
            logger_1.logger.info('AI-generated routine saved to database', {
                routineId: createdRoutine.id,
                trainerId,
                exerciseCount: routine.exercises.length
            });
            return createdRoutine;
        }
        catch (error) {
            logger_1.logger.error('Error saving AI routine to database', { error, routine, trainerId });
            throw error;
        }
    }
    /**
     * Formatea la rutina para envío por WhatsApp
     */
    formatRoutineForWhatsApp(routine) {
        let message = `🏋️‍♂️ *${routine.name}*\n\n`;
        message += `📝 *Descripción:* ${routine.description}\n\n`;
        message += `⏱️ *Duración:* ${routine.duration}\n\n`;
        message += `💪 *EJERCICIOS:*\n\n`;
        routine.exercises.forEach((exercise, index) => {
            message += `${index + 1}. *${exercise.name}*\n`;
            message += `   • Series: ${exercise.sets}\n`;
            message += `   • Repeticiones: ${exercise.reps}\n`;
            message += `   • Descanso: ${exercise.rest_seconds}s\n`;
            message += `   • Músculos: ${exercise.muscle_groups.join(', ')}\n`;
            if (exercise.instructions) {
                message += `   • Instrucciones: ${exercise.instructions}\n`;
            }
            message += `\n`;
        });
        message += `✅ *¡Rutina generada automáticamente por TrainFit Bot!*`;
        return message;
    }
}
exports.AIRoutineService = AIRoutineService;
exports.aiRoutineService = new AIRoutineService();
