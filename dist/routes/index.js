"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const clientProfile_routes_1 = __importDefault(require("./clientProfile.routes"));
const clientProgress_routes_1 = __importDefault(require("./clientProgress.routes"));
const clientStats_routes_1 = __importDefault(require("./clientStats.routes"));
const user_routes_1 = __importDefault(require("./user.routes")); // ✅
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/clients', clientProfile_routes_1.default);
router.use('/clients', clientProgress_routes_1.default);
router.use('/clients', clientStats_routes_1.default);
router.use('/users', user_routes_1.default); // ✅
exports.default = router;
