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
exports.deleteWorkout = exports.updateWorkout = exports.getWorkout = exports.getWorkouts = exports.createWorkout = void 0;
const workout_model_1 = __importDefault(require("../models/workout.model"));
// @desc    Create new workout
// @route   POST /api/workouts
// @access  Private
const createWorkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Make sure to set the createdBy field from the authenticated user
        const workoutData = Object.assign(Object.assign({}, req.body), { createdBy: req.user.id // This should match the field name in your model
         });
        const workout = yield workout_model_1.default.create(workoutData);
        res.status(201).json({
            success: true,
            data: workout
        });
    }
    catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.createWorkout = createWorkout;
// @desc    Get all workouts
// @route   GET /api/workouts
// @access  Private
const getWorkouts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query;
        // Copy req.query
        const reqQuery = Object.assign({}, req.query);
        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];
        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        // Create query string
        let queryStr = JSON.stringify(reqQuery);
        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        // Finding resource
        query = workout_model_1.default.find(JSON.parse(queryStr));
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
        const total = yield workout_model_1.default.countDocuments(JSON.parse(queryStr));
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const workouts = yield query;
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
            count: workouts.length,
            pagination,
            data: workouts
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getWorkouts = getWorkouts;
// @desc    Get single workout
// @route   GET /api/workouts/:id
// @access  Private
const getWorkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workout = yield workout_model_1.default.findById(req.params.id);
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
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
exports.getWorkout = getWorkout;
// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private (Trainer, Admin)
const updateWorkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let workout = yield workout_model_1.default.findById(req.params.id);
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        // Make sure user is workout owner or admin
        if (workout.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this workout'
            });
        }
        workout = yield workout_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
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
exports.updateWorkout = updateWorkout;
// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private (Trainer, Admin)
const deleteWorkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workout = yield workout_model_1.default.findById(req.params.id);
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        // Make sure user is workout owner or admin
        if (workout.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this workout'
            });
        }
        yield workout.deleteOne();
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
});
exports.deleteWorkout = deleteWorkout;
