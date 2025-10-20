"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectExercisesForDay = void 0;
const client_1 = require("@prisma/client");
const objectiveRules_1 = require("../types/objectiveRules");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Función principal para seleccionar ejercicios para un día específico
 */
const selectExercisesForDay = async (params) => {
    const { objetivo, splitDay, nivel, genero, dias } = params;
    logger_1.logger.info(`Seleccionando ejercicios para objetivo: ${objetivo}, día: ${splitDay}, nivel: ${nivel}`);
    // Obtener reglas del objetivo
    const rules = (0, objectiveRules_1.getObjectiveRules)(objetivo);
    if (!rules) {
        throw new Error(`Objetivo no válido: ${objetivo}`);
    }
    // Obtener cuotas de grupos musculares para el día
    const splitType = dias === 2 ? 'twoDays' : 'threeDays';
    const muscleQuotas = (0, objectiveRules_1.getMuscleQuotasForDay)(objetivo, splitType, splitDay);
    if (!muscleQuotas) {
        throw new Error(`No se encontraron cuotas para el día ${splitDay} del split de ${dias} días`);
    }
    const selectedExercises = [];
    let exerciseOrder = 1;
    // 1. Agregar ejercicios de movilidad (1-2 ejercicios)
    const mobilityExercises = await selectMobilityExercises(1, exerciseOrder);
    selectedExercises.push(...mobilityExercises);
    exerciseOrder += mobilityExercises.length;
    // 2. Seleccionar ejercicios principales según cuotas
    const mainExercises = await selectMainExercises(muscleQuotas, rules, nivel, genero, exerciseOrder);
    selectedExercises.push(...mainExercises);
    exerciseOrder += mainExercises.length;
    // 3. Agregar finisher/core (1 ejercicio)
    const finisherExercises = await selectFinisherExercises(1, exerciseOrder);
    selectedExercises.push(...finisherExercises);
    // 4. Completar hasta 10 ejercicios si es necesario
    if (selectedExercises.length < 10) {
        const remaining = 10 - selectedExercises.length;
        const fillerExercises = await selectFillerExercises(remaining, selectedExercises, muscleQuotas, rules, nivel, genero, selectedExercises.length + 1);
        selectedExercises.push(...fillerExercises);
    }
    logger_1.logger.info(`Seleccionados ${selectedExercises.length} ejercicios para el día ${splitDay}`);
    return selectedExercises.slice(0, 10); // Asegurar máximo 10 ejercicios
};
exports.selectExercisesForDay = selectExercisesForDay;
/**
 * Seleccionar ejercicios de movilidad
 */
const selectMobilityExercises = async (count, startOrder) => {
    try {
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { muscles: { hasSome: ['movilidad', 'Movilidad'] } },
                    { type: { contains: 'movilidad', mode: 'insensitive' } },
                    { name: { contains: 'estiramiento', mode: 'insensitive' } },
                    { name: { contains: 'calentamiento', mode: 'insensitive' } }
                ]
            },
            take: count * 3 // Obtener más para tener opciones
        });
        if (exercises.length === 0) {
            logger_1.logger.warn('No se encontraron ejercicios de movilidad, usando ejercicios básicos');
            return createDefaultMobilityExercises(count, startOrder);
        }
        return exercises.slice(0, count).map((exercise, index) => mapExerciseToSelected(exercise, startOrder + index, 'movilidad', {
            sets: 1,
            reps: '10-15',
            weight: 'Peso corporal',
            restTime: '30 seg'
        }));
    }
    catch (error) {
        logger_1.logger.error('Error seleccionando ejercicios de movilidad:', error);
        return createDefaultMobilityExercises(count, startOrder);
    }
};
/**
 * Seleccionar ejercicios principales según cuotas de grupos musculares
 */
const selectMainExercises = async (muscleQuotas, rules, nivel, genero, startOrder = 1) => {
    const selectedExercises = [];
    let currentOrder = startOrder;
    for (const [muscleGroup, quota] of Object.entries(muscleQuotas)) {
        if (quota > 0) {
            const exercises = await selectExercisesForMuscleGroup(muscleGroup, quota, rules, nivel, genero);
            exercises.forEach((exercise, index) => {
                selectedExercises.push({
                    ...exercise,
                    order: currentOrder + index,
                    category: 'principal'
                });
            });
            currentOrder += exercises.length;
        }
    }
    return selectedExercises;
};
/**
 * Seleccionar ejercicios para un grupo muscular específico
 */
const selectExercisesForMuscleGroup = async (muscleGroup, count, rules, nivel, genero) => {
    // Mapear grupo muscular a términos de búsqueda en la DB
    const searchTerms = objectiveRules_1.MUSCLE_GROUP_MAPPING[muscleGroup] || [muscleGroup];
    try {
        // Buscar ejercicios que contengan los términos del grupo muscular
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: searchTerms.flatMap(term => [
                    { muscles: { hasSome: [term] } },
                    { muscles: { hasSome: [term.charAt(0).toUpperCase() + term.slice(1)] } },
                    { name: { contains: term, mode: 'insensitive' } },
                    { type: { contains: term, mode: 'insensitive' } }
                ]),
                AND: [
                    genero ? {
                        OR: [
                            { objectives: { hasSome: [genero] } },
                            { objectives: { hasSome: ['unisex'] } },
                            { objectives: { isEmpty: true } }
                        ]
                    } : {}
                ]
            },
            take: count * 5 // Obtener más ejercicios para tener opciones
        });
        if (exercises.length === 0) {
            logger_1.logger.warn(`No se encontraron ejercicios para el grupo muscular: ${muscleGroup}`);
            return createFallbackExercises(muscleGroup, count, rules, nivel);
        }
        // Priorizar ejercicios multiarticulares
        const prioritizedExercises = prioritizeExercises(exercises, rules.priority);
        // Seleccionar los mejores ejercicios
        const selectedExercises = prioritizedExercises.slice(0, count);
        return selectedExercises.map((exercise, index) => mapExerciseToSelected(exercise, index + 1, 'principal', {
            sets: getRandomInRange(rules.seriesRange.min, rules.seriesRange.max),
            reps: `${rules.repRange.min}-${rules.repRange.max}`,
            weight: getEstimatedWeight(rules, nivel),
            restTime: getRestTime(rules, nivel)
        }));
    }
    catch (error) {
        logger_1.logger.error(`Error seleccionando ejercicios para ${muscleGroup}:`, error);
        return createFallbackExercises(muscleGroup, count, rules, nivel);
    }
};
/**
 * Priorizar ejercicios según las reglas del objetivo
 */
const prioritizeExercises = (exercises, priorityOrder) => {
    return exercises.sort((a, b) => {
        const priorityA = getPriorityScore(a, priorityOrder);
        const priorityB = getPriorityScore(b, priorityOrder);
        // Prioridad más alta = score más bajo
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        // Si tienen la misma prioridad, priorizar multiarticulares
        const isMultiA = (0, objectiveRules_1.isMultiarticular)(a.name);
        const isMultiB = (0, objectiveRules_1.isMultiarticular)(b.name);
        if (isMultiA && !isMultiB)
            return -1;
        if (!isMultiA && isMultiB)
            return 1;
        return 0;
    });
};
/**
 * Obtener score de prioridad para un ejercicio
 */
const getPriorityScore = (exercise, priorityOrder) => {
    const exercisePriority = (0, objectiveRules_1.getExercisePriority)(exercise.name);
    const index = priorityOrder.indexOf(exercisePriority);
    return index === -1 ? priorityOrder.length : index;
};
/**
 * Seleccionar ejercicios finisher/core
 */
const selectFinisherExercises = async (count, startOrder) => {
    try {
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { muscles: { hasSome: ['core', 'Core', 'abdominales', 'Abdominales'] } },
                    { name: { contains: 'plancha', mode: 'insensitive' } },
                    { name: { contains: 'abdominal', mode: 'insensitive' } },
                    { name: { contains: 'core', mode: 'insensitive' } }
                ]
            },
            take: count * 3
        });
        if (exercises.length === 0) {
            return createDefaultFinisherExercises(count, startOrder);
        }
        return exercises.slice(0, count).map((exercise, index) => mapExerciseToSelected(exercise, startOrder + index, 'finisher', {
            sets: 3,
            reps: '15-20',
            weight: 'Peso corporal',
            restTime: '45 seg'
        }));
    }
    catch (error) {
        logger_1.logger.error('Error seleccionando ejercicios finisher:', error);
        return createDefaultFinisherExercises(count, startOrder);
    }
};
/**
 * Seleccionar ejercicios de relleno para completar hasta 10
 */
const selectFillerExercises = async (count, existingExercises, muscleQuotas, rules, nivel, genero, startOrder = 1) => {
    const usedExerciseIds = new Set(existingExercises.map(ex => ex.id));
    const fillerExercises = [];
    // Obtener ejercicios adicionales de los grupos musculares principales
    const mainMuscleGroups = Object.keys(muscleQuotas);
    for (let i = 0; i < count && fillerExercises.length < count; i++) {
        const muscleGroup = mainMuscleGroups[i % mainMuscleGroups.length];
        const additionalExercises = await selectExercisesForMuscleGroup(muscleGroup, 1, rules, nivel, genero);
        const newExercises = additionalExercises.filter(ex => !usedExerciseIds.has(ex.id));
        if (newExercises.length > 0) {
            const exercise = newExercises[0];
            exercise.order = startOrder + fillerExercises.length;
            exercise.category = 'principal';
            fillerExercises.push(exercise);
            usedExerciseIds.add(exercise.id);
        }
    }
    return fillerExercises;
};
/**
 * Mapear ejercicio de DB a ejercicio seleccionado
 */
const mapExerciseToSelected = (exercise, order, category, params) => {
    return {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        type: exercise.type,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        muscles: exercise.muscles || [],
        imageUrl: exercise.imageUrl,
        videoUrl: exercise.videoUrl,
        sets: params.sets,
        reps: params.reps,
        weight: params.weight,
        restTime: params.restTime,
        notes: '',
        order,
        category,
        priority: (0, objectiveRules_1.getExercisePriority)(exercise.name)
    };
};
/**
 * Crear ejercicios de movilidad por defecto
 */
const createDefaultMobilityExercises = (count, startOrder) => {
    const defaultExercises = [
        { name: 'Calentamiento articular', description: 'Movilidad articular general' },
        { name: 'Estiramiento dinámico', description: 'Preparación muscular' }
    ];
    return defaultExercises.slice(0, count).map((exercise, index) => ({
        id: `default_mobility_${index}`,
        name: exercise.name,
        description: exercise.description,
        type: 'Movilidad',
        equipment: 'Ninguno',
        difficulty: 'Principiante',
        muscles: ['Cuerpo completo'],
        sets: 1,
        reps: '10-15',
        weight: 'Peso corporal',
        restTime: '30 seg',
        notes: 'Ejercicio de calentamiento',
        order: startOrder + index,
        category: 'movilidad',
        priority: 'movilidad'
    }));
};
/**
 * Crear ejercicios finisher por defecto
 */
const createDefaultFinisherExercises = (count, startOrder) => {
    const defaultExercises = [
        { name: 'Plancha', description: 'Ejercicio isométrico de core' },
        { name: 'Abdominales', description: 'Fortalecimiento abdominal' }
    ];
    return defaultExercises.slice(0, count).map((exercise, index) => ({
        id: `default_finisher_${index}`,
        name: exercise.name,
        description: exercise.description,
        type: 'Core',
        equipment: 'Peso corporal',
        difficulty: 'Principiante',
        muscles: ['Core'],
        sets: 3,
        reps: '15-20',
        weight: 'Peso corporal',
        restTime: '45 seg',
        notes: 'Ejercicio de finalización',
        order: startOrder + index,
        category: 'finisher',
        priority: 'core'
    }));
};
/**
 * Crear ejercicios de respaldo cuando no se encuentran en la DB
 */
const createFallbackExercises = (muscleGroup, count, rules, nivel) => {
    const fallbackMap = {
        pectorales: ['Flexiones', 'Press de pecho'],
        dorsales: ['Remo', 'Dominadas asistidas'],
        piernas: ['Sentadillas', 'Zancadas'],
        hombros: ['Elevaciones laterales', 'Press de hombros'],
        biceps: ['Curl de bíceps', 'Martillo'],
        triceps: ['Fondos', 'Extensiones'],
        core: ['Plancha', 'Crunch']
    };
    const exercises = fallbackMap[muscleGroup] || ['Ejercicio funcional'];
    return exercises.slice(0, count).map((name, index) => ({
        id: `fallback_${muscleGroup}_${index}`,
        name,
        description: `Ejercicio de ${muscleGroup}`,
        type: 'Funcional',
        equipment: 'Peso corporal',
        difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
        muscles: [muscleGroup],
        sets: getRandomInRange(rules.seriesRange.min, rules.seriesRange.max),
        reps: `${rules.repRange.min}-${rules.repRange.max}`,
        weight: getEstimatedWeight(rules, nivel),
        restTime: getRestTime(rules, nivel),
        notes: 'Ejercicio de respaldo - considerar agregar más ejercicios a la base de datos',
        order: index + 1,
        category: 'principal',
        priority: 'aislamiento'
    }));
};
/**
 * Obtener peso estimado según nivel
 */
const getEstimatedWeight = (rules, nivel) => {
    const weightMap = {
        principiante: 'Ligero',
        intermedio: 'Moderado',
        avanzado: 'Pesado'
    };
    return weightMap[nivel] || 'Moderado';
};
/**
 * Obtener tiempo de descanso según reglas y nivel
 */
const getRestTime = (rules, nivel) => {
    const baseRest = rules.repRange.max <= 6 ? '3 min' :
        rules.repRange.max <= 12 ? '2 min' : '90 seg';
    if (nivel === 'principiante') {
        return baseRest === '90 seg' ? '2 min' : baseRest;
    }
    return baseRest;
};
/**
 * Obtener número aleatorio en rango
 */
const getRandomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.default = {
    selectExercisesForDay: exports.selectExercisesForDay
};
