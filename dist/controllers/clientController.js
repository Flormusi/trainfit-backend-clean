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
exports.getProfile = exports.createOrUpdateProfile = void 0;
const Client_1 = __importDefault(require("../models/Client"));
// @desc    Create or update client profile
// @route   POST /api/clients/profile
// @access  Private
const createOrUpdateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Creating/updating client profile for user:', req.user.id);
        console.log('Request body:', req.body);
        // Set CORS headers explicitly
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        // Check if client profile already exists
        let clientProfile = yield Client_1.default.findOne({ user: req.user.id });
        if (clientProfile) {
            // Update existing profile
            clientProfile = yield Client_1.default.findOneAndUpdate({ user: req.user.id }, Object.assign({}, req.body), { new: true, runValidators: true });
            console.log('Updated existing client profile');
        }
        else {
            // Create new profile
            clientProfile = yield Client_1.default.create(Object.assign({ user: req.user.id }, req.body));
            console.log('Created new client profile');
        }
        res.json({
            success: true,
            data: clientProfile
        });
    }
    catch (error) {
        console.error('Error creating/updating client profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error saving client profile'
        });
    }
});
exports.createOrUpdateProfile = createOrUpdateProfile;
// Apply the same CORS headers to the getProfile function
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Set CORS headers explicitly
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        const clientProfile = yield Client_1.default.findOne({ user: req.user.id });
        if (!clientProfile) {
            return res.status(404).json({
                success: false,
                message: 'Client profile not found'
            });
        }
        res.json({
            success: true,
            data: clientProfile
        });
    }
    catch (error) {
        console.error('Error getting client profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting client profile'
        });
    }
});
exports.getProfile = getProfile;
