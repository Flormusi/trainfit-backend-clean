"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const progress_controller_1 = require("../controllers/progress.controller");
const router = express_1.default.Router();
// All routes are protected
router.use(auth_middleware_1.protect);
// Stats and timeline routes
router.get('/stats', progress_controller_1.getProgressStats);
router.get('/timeline', progress_controller_1.getProgressTimeline);
// CRUD routes
router.route('/')
    .get(progress_controller_1.getMyProgress)
    .post(progress_controller_1.createProgressRecord);
router.route('/:id')
    .get(progress_controller_1.getProgressRecord)
    .put(progress_controller_1.updateProgressRecord)
    .delete(progress_controller_1.deleteProgressRecord);
exports.default = router;
