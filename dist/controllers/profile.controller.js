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
exports.getClientProfiles = exports.updateProfile = exports.createProfile = exports.getProfile = void 0;
const profile_model_1 = __importDefault(require("../models/profile.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield profile_model_1.default.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        res.status(200).json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getProfile = getProfile;
// @desc    Create user profile
// @route   POST /api/profile
// @access  Private
const createProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if profile already exists
        const existingProfile = yield profile_model_1.default.findOne({ user: req.user.id });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: 'Profile already exists for this user'
            });
        }
        // Create profile
        const profileData = Object.assign(Object.assign({}, req.body), { user: req.user.id });
        const profile = yield profile_model_1.default.create(profileData);
        // Update user to mark profile as completed
        yield user_model_1.default.findByIdAndUpdate(req.user.id, {
            hasCompletedProfile: true
        });
        res.status(201).json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.createProfile = createProfile;
// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield profile_model_1.default.findOneAndUpdate({ user: req.user.id }, req.body, {
            new: true,
            runValidators: true,
            upsert: true
        });
        // If this is the first time creating a profile, update user
        if (!profile) {
            yield user_model_1.default.findByIdAndUpdate(req.user.id, {
                hasCompletedProfile: true
            });
        }
        res.status(200).json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.updateProfile = updateProfile;
// @desc    Get all client profiles (for trainers)
// @route   GET /api/profile/clients
// @access  Private/Trainer
const getClientProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all users with role 'client'
        const clients = yield user_model_1.default.find({ role: 'client' });
        // Get their profiles
        const clientIds = clients.map(client => client._id);
        const profiles = yield profile_model_1.default.find({ user: { $in: clientIds } });
        // Combine user and profile data
        const clientProfiles = yield Promise.all(profiles.map((profile) => __awaiter(void 0, void 0, void 0, function* () {
            const user = clients.find(client => client._id.toString() === profile.user.toString());
            return {
                user: {
                    id: user === null || user === void 0 ? void 0 : user._id,
                    name: user === null || user === void 0 ? void 0 : user.name,
                    email: user === null || user === void 0 ? void 0 : user.email,
                    hasCompletedOnboarding: user === null || user === void 0 ? void 0 : user.hasCompletedOnboarding
                },
                profile
            };
        })));
        res.status(200).json({
            success: true,
            count: clientProfiles.length,
            data: clientProfiles
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});
exports.getClientProfiles = getClientProfiles;
