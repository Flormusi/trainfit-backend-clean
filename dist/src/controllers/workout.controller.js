"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkout = exports.updateWorkout = exports.getWorkout = exports.getWorkouts = exports.createWorkout = void 0;
const exercise_model_1 = __importDefault(require("../models/exercise.model"));
// @desc    Create new workout
// @route   POST /api/workouts
// @access  Private
const createWorkout = async (req, res) => {
    try {
        const { name, description, type, difficulty, equipment, muscles = [] } = req.body;
        const trainerId = req.user.id;
        const exercise = await exercise_model_1.default.exercise.create({
            data: {
                name,
                description,
                type,
                difficulty,
                equipment,
                muscles,
                trainerId
            }
        });
        res.status(201).json({
            success: true,
            data: exercise
        });
    }
    catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.createWorkout = createWorkout;
// @desc    Get all workouts
// @route   GET /api/workouts
// @access  Private
const getWorkouts = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const skip = (page - 1) * limit;
        const where = {};
        if (req.query.type)
            where.type = req.query.type;
        if (req.query.difficulty)
            where.difficulty = req.query.difficulty;
        if (req.user.role === 'TRAINER')
            where.trainerId = req.user.id;
        const [exercises, total] = await Promise.all([
            exercise_model_1.default.exercise.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            exercise_model_1.default.exercise.count({ where })
        ]);
        const pagination = {};
        if (skip + limit < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (skip > 0) {
            pagination.prev = { page: page - 1, limit };
        }
        res.status(200).json({
            success: true,
            count: exercises.length,
            pagination,
            data: exercises
        });
    }
    catch (error) {
        console.error('Error getting workouts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getWorkouts = getWorkouts;
// @desc    Get single workout
// @route   GET /api/workouts/:id
// @access  Private
const getWorkout = async (req, res) => {
    try {
        const exercise = await exercise_model_1.default.exercise.findUnique({
            where: { id: req.params.id }
        });
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        res.status(200).json({
            success: true,
            data: exercise
        });
    }
    catch (error) {
        console.error('Error getting workout:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getWorkout = getWorkout;
// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private (Trainer, Admin)
const updateWorkout = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, difficulty, equipment, muscles } = req.body;
        const trainerId = req.user.id;
        const exercise = await exercise_model_1.default.exercise.findUnique({
            where: { id }
        });
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        if (exercise.trainerId !== trainerId && req.user.role !== 'ADMIN') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this exercise'
            });
        }
        const updatedExercise = await exercise_model_1.default.exercise.update({
            where: { id },
            data: {
                name,
                description,
                type,
                difficulty,
                equipment,
                muscles
            }
        });
        res.status(200).json({
            success: true,
            data: updatedExercise
        });
    }
    catch (error) {
        console.error('Error updating exercise:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.updateWorkout = updateWorkout;
// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private (Trainer, Admin)
const deleteWorkout = async (req, res) => {
    try {
        const { id } = req.params;
        const trainerId = req.user.id;
        const exercise = await exercise_model_1.default.exercise.findUnique({
            where: { id }
        });
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        if (exercise.trainerId !== trainerId && req.user.role !== 'ADMIN') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this exercise'
            });
        }
        await exercise_model_1.default.exercise.delete({
            where: { id }
        });
        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        console.error('Error deleting exercise:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.deleteWorkout = deleteWorkout;
