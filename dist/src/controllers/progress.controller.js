"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExerciseProgress = exports.getProgressTimeline = exports.getProgressStats = exports.deleteProgressRecord = exports.updateProgressRecord = exports.createProgressRecord = exports.getProgressRecord = exports.getMyProgress = void 0;
const progress_model_1 = __importDefault(require("../models/progress.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// @desc    Get all progress records for a user
// @route   GET /api/progress
// @access  Private
const getMyProgress = async (req, res) => {
    try {
        const progress = await progress_model_1.default.find({
            user: req.user.id
        }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: progress.length,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getMyProgress = getMyProgress;
// @desc    Get single progress record
// @route   GET /api/progress/:id
// @access  Private
const getProgressRecord = async (req, res) => {
    try {
        const progress = await progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(await isTrainerForClient(progress.user, req.user.id))) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this progress record'
            });
        }
        res.status(200).json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getProgressRecord = getProgressRecord;
// @desc    Create new progress record
// @route   POST /api/progress
// @access  Private
const createProgressRecord = async (req, res) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;
        const progress = await progress_model_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.createProgressRecord = createProgressRecord;
// @desc    Update progress record
// @route   PUT /api/progress/:id
// @access  Private
const updateProgressRecord = async (req, res) => {
    try {
        let progress = await progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(await isTrainerForClient(progress.user, req.user.id))) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this progress record'
            });
        }
        progress = await progress_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.updateProgressRecord = updateProgressRecord;
// @desc    Delete progress record
// @route   DELETE /api/progress/:id
// @access  Private
const deleteProgressRecord = async (req, res) => {
    try {
        const progress = await progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(await isTrainerForClient(progress.user, req.user.id))) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this progress record'
            });
        }
        await progress.deleteOne();
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
exports.deleteProgressRecord = deleteProgressRecord;
// @desc    Get progress statistics
// @route   GET /api/progress/stats
// @access  Private
const getProgressStats = async (req, res) => {
    try {
        const userId = req.user.id;
        // Get all progress records for the user
        const progressRecords = await progress_model_1.default.find({ user: userId }).sort({ date: 1 });
        if (progressRecords.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    weightChange: null,
                    bodyFatChange: null,
                    measurementChanges: {},
                    recordCount: 0,
                    firstRecordDate: null,
                    lastRecordDate: null
                }
            });
        }
        // Calculate weight change
        const firstWeight = progressRecords[0].weight;
        const lastWeight = progressRecords[progressRecords.length - 1].weight;
        const weightChange = firstWeight && lastWeight ? lastWeight - firstWeight : null;
        // Calculate body fat change
        const firstBodyFat = progressRecords[0].bodyFat;
        const lastBodyFat = progressRecords[progressRecords.length - 1].bodyFat;
        const bodyFatChange = firstBodyFat !== undefined && lastBodyFat !== undefined ?
            lastBodyFat - firstBodyFat : null;
        // Calculate measurement changes
        const measurementChanges = {};
        const measurementKeys = ['chest', 'waist', 'hips', 'thighs', 'arms', 'shoulders'];
        measurementKeys.forEach(key => {
            const measurementKey = key;
            const firstMeasurement = progressRecords[0].measurements?.[measurementKey];
            const lastMeasurement = progressRecords[progressRecords.length - 1].measurements?.[measurementKey];
            measurementChanges[key] = firstMeasurement !== undefined && lastMeasurement !== undefined ?
                lastMeasurement - firstMeasurement : null;
        });
        res.status(200).json({
            success: true,
            data: {
                weightChange,
                bodyFatChange,
                measurementChanges,
                recordCount: progressRecords.length,
                firstRecordDate: progressRecords[0].date,
                lastRecordDate: progressRecords[progressRecords.length - 1].date
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getProgressStats = getProgressStats;
// @desc    Get progress timeline data
// @route   GET /api/progress/timeline
// @access  Private
const getProgressTimeline = async (req, res) => {
    try {
        const userId = req.user.id;
        const { metric = 'weight', startDate, endDate } = req.query;
        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }
        // Build query
        const query = { user: userId };
        if (Object.keys(dateFilter).length > 0) {
            query.date = dateFilter;
        }
        // Get progress records
        const progressRecords = await progress_model_1.default.find(query).sort({ date: 1 });
        // Format data for timeline
        const timelineData = progressRecords.map(record => {
            let value = null;
            if (metric === 'weight') {
                value = record.weight;
            }
            else if (metric === 'bodyFat') {
                value = record.bodyFat;
            }
            else if (metric?.toString().startsWith('measurements.')) {
                const measurementKey = metric.toString().split('.')[1];
                value = record.measurements?.[measurementKey];
            }
            return {
                date: record.date,
                value
            };
        });
        res.status(200).json({
            success: true,
            data: timelineData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.getProgressTimeline = getProgressTimeline;
// @desc    Update exercise progress (weight, sets, reps)
// @route   POST /api/progress/exercise/:exerciseId
// @access  Private
const updateExerciseProgress = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { weight, sets, reps, notes } = req.body;
        const userId = req.user.id;
        // Create or update progress record for this exercise
        const progressData = {
            user: userId,
            exerciseId,
            weight: weight || undefined,
            sets: sets || undefined,
            reps: reps || undefined,
            notes: notes || undefined,
            date: new Date()
        };
        // Find existing progress record for today or create new one
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        let progress = await progress_model_1.default.findOne({
            user: userId,
            exerciseId,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });
        if (progress) {
            // Update existing record
            progress.weight = weight || progress.weight;
            progress.sets = sets || progress.sets;
            progress.reps = reps || progress.reps;
            progress.notes = notes || progress.notes;
            await progress.save();
        }
        else {
            // Create new record
            progress = await progress_model_1.default.create(progressData);
        }
        res.status(200).json({
            success: true,
            message: 'Exercise progress updated successfully',
            data: progress
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
exports.updateExerciseProgress = updateExerciseProgress;
// Helper function to check if a user is a trainer for a specific client
const isTrainerForClient = async (clientId, trainerId) => {
    try {
        const client = await user_model_1.default.findById(clientId);
        return client?.trainer?.toString() === trainerId;
    }
    catch (error) {
        return false;
    }
};
