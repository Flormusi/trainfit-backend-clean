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
exports.getProgressTimeline = exports.getProgressStats = exports.deleteProgressRecord = exports.updateProgressRecord = exports.createProgressRecord = exports.getProgressRecord = exports.getMyProgress = void 0;
const progress_model_1 = __importDefault(require("../models/progress.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// @desc    Get all progress records for a user
// @route   GET /api/progress
// @access  Private
const getMyProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const progress = yield progress_model_1.default.find({
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
});
exports.getMyProgress = getMyProgress;
// @desc    Get single progress record
// @route   GET /api/progress/:id
// @access  Private
const getProgressRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const progress = yield progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(yield isTrainerForClient(progress.user, req.user.id))) {
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
});
exports.getProgressRecord = getProgressRecord;
// @desc    Create new progress record
// @route   POST /api/progress
// @access  Private
const createProgressRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Add user to req.body
        req.body.user = req.user.id;
        const progress = yield progress_model_1.default.create(req.body);
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
});
exports.createProgressRecord = createProgressRecord;
// @desc    Update progress record
// @route   PUT /api/progress/:id
// @access  Private
const updateProgressRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let progress = yield progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(yield isTrainerForClient(progress.user, req.user.id))) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this progress record'
            });
        }
        progress = yield progress_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
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
});
exports.updateProgressRecord = updateProgressRecord;
// @desc    Delete progress record
// @route   DELETE /api/progress/:id
// @access  Private
const deleteProgressRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const progress = yield progress_model_1.default.findById(req.params.id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress record not found'
            });
        }
        // Make sure user owns the progress record or is a trainer for the user
        if (progress.user.toString() !== req.user.id &&
            req.user.role !== 'admin' &&
            !(yield isTrainerForClient(progress.user, req.user.id))) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this progress record'
            });
        }
        yield progress.deleteOne();
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
exports.deleteProgressRecord = deleteProgressRecord;
// @desc    Get progress statistics
// @route   GET /api/progress/stats
// @access  Private
const getProgressStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Get all progress records for the user
        const progressRecords = yield progress_model_1.default.find({ user: userId }).sort({ date: 1 });
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
            var _a, _b;
            const measurementKey = key;
            const firstMeasurement = (_a = progressRecords[0].measurements) === null || _a === void 0 ? void 0 : _a[measurementKey];
            const lastMeasurement = (_b = progressRecords[progressRecords.length - 1].measurements) === null || _b === void 0 ? void 0 : _b[measurementKey];
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
});
exports.getProgressStats = getProgressStats;
// @desc    Get progress timeline data
// @route   GET /api/progress/timeline
// @access  Private
const getProgressTimeline = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const progressRecords = yield progress_model_1.default.find(query).sort({ date: 1 });
        // Format data for timeline
        const timelineData = progressRecords.map(record => {
            var _a;
            let value = null;
            if (metric === 'weight') {
                value = record.weight;
            }
            else if (metric === 'bodyFat') {
                value = record.bodyFat;
            }
            else if (metric === null || metric === void 0 ? void 0 : metric.toString().startsWith('measurements.')) {
                const measurementKey = metric.toString().split('.')[1];
                value = (_a = record.measurements) === null || _a === void 0 ? void 0 : _a[measurementKey];
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
});
exports.getProgressTimeline = getProgressTimeline;
// Helper function to check if a user is a trainer for a client
const isTrainerForClient = (clientId, trainerId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield user_model_1.default.findById(clientId);
    if (!client || client.role !== 'client') {
        return false;
    }
    // In a real app, you would check your trainer-client relationship model
    // For now, we'll assume all trainers can access all clients' progress
    return true;
});
