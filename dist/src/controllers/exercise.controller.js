"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEquipmentTypes = exports.getMuscleGroups = exports.getExerciseCategories = exports.deleteExercise = exports.updateExercise = exports.getExercise = exports.getExercises = exports.createExercise = void 0;
const exercise_model_1 = __importDefault(require("../models/exercise.model"));
// @desc    Create new exercise
// @route   POST /api/exercises
// @access  Private/Admin
const createExercise = async (req, res) => {
    try {
        // Add the creator field from the authenticated user
        const exerciseData = {
            ...req.body,
            createdBy: req.user.id
        };
        const exercise = await exercise_model_1.default.create(exerciseData);
        res.status(201).json({
            success: true,
            data: exercise
        });
    }
    catch (error) {
        console.error('Error creating exercise:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.createExercise = createExercise;
// @desc    Get all exercises
// @route   GET /api/exercises
// @access  Private
const getExercises = async (req, res) => {
    try {
        let query;
        // Copy req.query
        const reqQuery = { ...req.query };
        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];
        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        // Create query string
        let queryStr = JSON.stringify(reqQuery);
        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        // Finding resource
        query = exercise_model_1.default.find(JSON.parse(queryStr));
        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }
        else {
            query = query.sort('-createdAt');
        }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await exercise_model_1.default.countDocuments(JSON.parse(queryStr));
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const exercises = await query;
        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }
        res.status(200).json({
            success: true,
            count: exercises.length,
            pagination,
            data: exercises
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getExercises = getExercises;
// @desc    Get single exercise
// @route   GET /api/exercises/:id
// @access  Private
const getExercise = async (req, res) => {
    try {
        const exercise = await exercise_model_1.default.findById(req.params.id);
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
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getExercise = getExercise;
// @desc    Update exercise
// @route   PUT /api/exercises/:id
// @access  Private (Trainer, Admin)
const updateExercise = async (req, res) => {
    try {
        let exercise = await exercise_model_1.default.findById(req.params.id);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        // Make sure user is exercise owner or admin
        if (exercise.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this exercise'
            });
        }
        exercise = await exercise_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: exercise
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.updateExercise = updateExercise;
// @desc    Delete exercise
// @route   DELETE /api/exercises/:id
// @access  Private (Trainer, Admin)
const deleteExercise = async (req, res) => {
    try {
        const exercise = await exercise_model_1.default.findById(req.params.id);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        // Make sure user is exercise owner or admin
        if (exercise.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this exercise'
            });
        }
        await exercise.deleteOne();
        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.deleteExercise = deleteExercise;
// @desc    Get exercise categories
// @route   GET /api/exercises/categories
// @access  Private
const getExerciseCategories = async (req, res) => {
    try {
        const categories = [
            'strength',
            'cardio',
            'flexibility',
            'balance',
            'plyometric'
        ];
        res.status(200).json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getExerciseCategories = getExerciseCategories;
// @desc    Get muscle groups
// @route   GET /api/exercises/muscle-groups
// @access  Private
const getMuscleGroups = async (req, res) => {
    try {
        const muscleGroups = [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'forearms',
            'quadriceps',
            'hamstrings',
            'calves',
            'glutes',
            'abs',
            'obliques',
            'lower back',
            'full body'
        ];
        res.status(200).json({
            success: true,
            data: muscleGroups
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getMuscleGroups = getMuscleGroups;
// @desc    Get equipment types
// @route   GET /api/exercises/equipment
// @access  Private
const getEquipmentTypes = async (req, res) => {
    try {
        const equipmentTypes = [
            'barbell',
            'dumbbell',
            'kettlebell',
            'resistance bands',
            'cable machine',
            'smith machine',
            'bodyweight',
            'medicine ball',
            'stability ball',
            'foam roller',
            'bench',
            'pull-up bar',
            'treadmill',
            'stationary bike',
            'elliptical',
            'rowing machine',
            'none'
        ];
        res.status(200).json({
            success: true,
            data: equipmentTypes
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getEquipmentTypes = getEquipmentTypes;
