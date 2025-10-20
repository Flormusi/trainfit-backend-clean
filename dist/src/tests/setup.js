"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Set up MongoDB connection for testing
beforeAll(async () => {
    const url = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trainfit_test';
    await mongoose_1.default.connect(url);
});
// Close MongoDB connection after tests
afterAll(async () => {
    await mongoose_1.default.connection.close();
});
