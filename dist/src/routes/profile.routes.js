"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const profile_controller_1 = require("../controllers/profile.controller");
const router = express_1.default.Router();
// Routes for all authenticated users
router.route('/')
    .get(auth_middleware_1.protect, profile_controller_1.getProfile)
    .post(auth_middleware_1.protect, profile_controller_1.createProfile)
    .put(auth_middleware_1.protect, profile_controller_1.updateProfile);
// Routes for trainers only
router.get('/clients', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('trainer', 'admin'), profile_controller_1.getClientProfiles);
exports.default = router;
