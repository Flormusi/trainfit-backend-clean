"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exercise_controller_1 = require("../controllers/exercise.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router
    .route('/')
    .get(auth_1.protect, exercise_controller_1.getExercises)
    .post(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), exercise_controller_1.createExercise);
router
    .route('/:id')
    .get(auth_1.protect, exercise_controller_1.getExercise)
    .put(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), exercise_controller_1.updateExercise)
    .delete(auth_1.protect, (0, auth_1.authorize)('trainer', 'admin'), exercise_controller_1.deleteExercise);
exports.default = router;
