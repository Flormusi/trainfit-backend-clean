"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientProfiles = exports.updateProfile = exports.createProfile = exports.getProfile = void 0;
const profile_model_1 = __importDefault(require("../models/profile.model"));
const user_model_1 = __importDefault(require("../models/user.model")); // Import IUser
// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const profile = await profile_model_1.default.findOne({ user: req.user.id });
        if (!profile) {
            res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
            return; // <--- AÑADIDO
        }
        res.status(200).json({
            success: true,
            data: profile
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
};
exports.getProfile = getProfile;
// @desc    Create user profile
// @route   POST /api/profile
// @access  Private
const createProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await profile_model_1.default.findOne({ user: req.user.id });
        if (existingProfile) {
            res.status(400).json({
                success: false,
                message: 'Profile already exists for this user'
            });
            return; // <--- AÑADIDO
        }
        // Create profile
        const profileData = {
            ...req.body,
            user: req.user.id
        };
        const profile = await profile_model_1.default.create(profileData);
        // Update user to mark profile as completed
        await user_model_1.default.findByIdAndUpdate(req.user.id, {
            hasCompletedProfile: true
        });
        res.status(201).json({
            success: true,
            data: profile
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
};
exports.createProfile = createProfile;
// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const profile = await profile_model_1.default.findOneAndUpdate({ user: req.user.id }, req.body, {
            new: true,
            runValidators: true,
            upsert: true // Nota: upsert: true puede crear el documento si no existe.
        });
        // Si findOneAndUpdate con upsert:true crea el documento, 'profile' contendrá el nuevo documento.
        // Si actualiza uno existente, 'profile' contendrá el documento actualizado (debido a new: true).
        // Por lo tanto, 'profile' no debería ser null aquí si la operación tiene éxito.
        // La lógica original de 'if (!profile)' para actualizar 'hasCompletedProfile' podría necesitar revisión
        // si el objetivo era solo hacerlo en la creación. Con upsert, es más complejo.
        // Por ahora, nos enfocamos en el tipo de retorno.
        // Asumiendo que si el perfil se crea o actualiza, queremos marcar hasCompletedProfile
        // Esta lógica podría necesitar ser más específica si solo es en la creación inicial.
        await user_model_1.default.findByIdAndUpdate(req.user.id, {
            hasCompletedProfile: true
        });
        res.status(200).json({
            success: true,
            data: profile // 'profile' será el documento creado o actualizado
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
        return; // <--- AÑADIDO por consistencia y seguridad
    }
};
exports.updateProfile = updateProfile;
// @desc    Get all client profiles (for trainers)
// @route   GET /api/profile/clients
// @access  Private/Trainer
const getClientProfiles = async (req, res) => {
    try {
        // Find all users with role 'client'
        const clients = await user_model_1.default.find({ role: 'client' });
        // Get their profiles
        const clientIds = clients.map(client => client._id);
        const profiles = await profile_model_1.default.find({ user: { $in: clientIds } });
        // Combine user and profile data
        const clientProfiles = await Promise.all(profiles.map(async (profile) => {
            const user = clients.find((client) => 
            // Workaround: Cast client to 'any' before accessing _id
            client._id.toString() === profile.user.toString());
            return {
                user: {
                    // Apply 'as any' here as well if 'user' is found but its properties are unknown
                    id: user ? user._id : undefined,
                    name: user ? user.name : undefined,
                    email: user ? user.email : undefined,
                    hasCompletedOnboarding: user ? user.hasCompletedOnboarding : undefined
                },
                profile
            };
        }));
        res.status(200).json({
            success: true,
            count: clientProfiles.length,
            data: clientProfiles
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
        return;
    }
};
exports.getClientProfiles = getClientProfiles;
