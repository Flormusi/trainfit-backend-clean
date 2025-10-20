"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
// Create a minimal express app for testing
const app = (0, express_1.default)();
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
describe('Health Check Endpoint', () => {
    it('should return 200 and correct message', async () => {
        const response = await (0, supertest_1.default)(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', message: 'Server is running' });
    });
});
