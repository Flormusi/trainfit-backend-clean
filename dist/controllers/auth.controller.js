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
exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.register = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const crypto_1 = __importDefault(require("crypto"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, membershipTier } = req.body;
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const user = yield user_model_1.default.create({
            name,
            email,
            password,
            role: role || 'client',
            membershipTier: role === 'client' ? membershipTier : undefined,
        });
        sendTokenResponse(user, 201, res);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please provide an email and password' });
            return;
        }
        const user = yield user_model_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        const isMatch = yield user.matchPassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        sendTokenResponse(user, 200, res);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.getMe = getMe;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findOne({ email: req.body.email });
        if (!user) {
            res.status(404).json({ success: false, message: 'No user with that email' });
            return;
        }
        const resetToken = user.getResetPasswordToken();
        yield user.save({ validateBeforeSave: false });
        res.status(200).json({
            success: true,
            message: `Password reset token sent to email: ${req.body.email}`,
            data: { resetToken },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(req.params.resettoken).digest('hex');
        const user = yield user_model_1.default.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid token' });
            return;
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        yield user.save();
        sendTokenResponse(user, 200, res);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.resetPassword = resetPassword;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            hasCompletedOnboarding: req.body.hasCompletedOnboarding,
            hasCompletedProfile: req.body.hasCompletedProfile,
        };
        const user = yield user_model_1.default.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
exports.updateProfile = updateProfile;
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() +
            (process.env.JWT_COOKIE_EXPIRE
                ? parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasCompletedOnboarding: user.hasCompletedOnboarding,
            hasCompletedProfile: user.hasCompletedProfile,
        },
    });
};
