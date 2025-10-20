"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workout_controller_1 = require("../controllers/workout.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router
    .route('/')
    .get(auth_1.protect, workout_controller_1.getWorkouts)
    .post(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), workout_controller_1.createWorkout);
router
    .route('/:id')
    .get(auth_1.protect, workout_controller_1.getWorkout)
    .put(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), workout_controller_1.updateWorkout)
    .delete(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), workout_controller_1.deleteWorkout);
exports.default = router;
