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
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const app_1 = __importDefault(require("../app"));
let mongoServer;
let token;
let userId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    yield mongoose_1.default.connect(uri);
    // Create a test user and get token
    const userData = {
        name: 'Exercise Test User',
        email: 'exercise@example.com',
        password: 'password123',
        role: 'trainer'
    };
    const response = yield (0, supertest_1.default)(app_1.default)
        .post('/api/auth/register')
        .send(userData);
    token = response.body.token;
    userId = response.body.user.id;
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.disconnect();
    yield mongoServer.stop();
}));
describe('Exercise Routes', () => {
    it('should create a new exercise', () => __awaiter(void 0, void 0, void 0, function* () {
        const exerciseData = {
            name: 'Bench Press',
            description: 'Lie on a bench and press the weight upward',
            muscleGroups: ['chest', 'triceps', 'shoulders'],
            equipment: 'barbell',
            difficulty: 'intermediate',
            instructions: [
                'Lie on the bench with your feet flat on the ground',
                'Grip the bar with hands slightly wider than shoulder-width',
                'Lower the bar to your chest',
                'Press the bar back up to starting position'
            ],
            videoUrl: 'https://example.com/bench-press.mp4'
        };
        const response = yield (0, supertest_1.default)(app_1.default)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${token}`)
            .send(exerciseData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', 'Bench Press');
        expect(response.body.data.muscleGroups).toContain('chest');
    }));
    it('should get all exercises', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.default)
            .get('/api/exercises')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(Array.isArray(response.body.data)).toBeTruthy();
    }));
    it('should get exercises by muscle group', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create an exercise with biceps as a muscle group first
        yield (0, supertest_1.default)(app_1.default)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'Bicep Curl',
            description: 'A bicep curl exercise',
            muscleGroups: ['biceps'],
            equipment: 'dumbbell',
            difficulty: 'beginner',
            instructions: ['Step 1', 'Step 2'],
            videoUrl: 'https://example.com/bicep-curl.mp4'
        });
        const res = yield (0, supertest_1.default)(app_1.default)
            .get('/api/exercises?muscleGroups=biceps')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const hasBicepsExercise = res.body.data.some((exercise) => exercise.muscleGroups.includes('biceps'));
        expect(hasBicepsExercise).toBeTruthy();
    }));
    it('should get a single exercise by ID', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create an exercise
        const exerciseData = {
            name: 'Squat',
            description: 'Lower your body by bending your knees',
            muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
            equipment: 'bodyweight',
            difficulty: 'beginner'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${token}`)
            .send(exerciseData);
        const exerciseId = createResponse.body.data._id;
        // Then get the exercise by ID
        const response = yield (0, supertest_1.default)(app_1.default)
            .get(`/api/exercises/${exerciseId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', 'Squat');
    }));
    it('should update an exercise', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create an exercise
        const exerciseData = {
            name: 'Deadlift',
            description: 'Lift a weight from the ground',
            muscleGroups: ['back', 'hamstrings', 'glutes'],
            equipment: 'barbell',
            difficulty: 'advanced'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${token}`)
            .send(exerciseData);
        const exerciseId = createResponse.body.data._id;
        // Then update the exercise
        const updateData = {
            name: 'Romanian Deadlift',
            description: 'A variation of the deadlift focusing on hamstrings',
            difficulty: 'intermediate'
        };
        const response = yield (0, supertest_1.default)(app_1.default)
            .put(`/api/exercises/${exerciseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('name', 'Romanian Deadlift');
        expect(response.body.data).toHaveProperty('difficulty', 'intermediate');
    }));
    it('should delete an exercise', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create an exercise
        const exerciseData = {
            name: 'Push-up',
            description: 'Push your body up from the ground',
            muscleGroups: ['chest', 'shoulders', 'triceps'],
            equipment: 'bodyweight',
            difficulty: 'beginner'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${token}`)
            .send(exerciseData);
        const exerciseId = createResponse.body.data._id;
        // Then delete the exercise
        const response = yield (0, supertest_1.default)(app_1.default)
            .delete(`/api/exercises/${exerciseId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        // Verify the exercise is deleted
        const getResponse = yield (0, supertest_1.default)(app_1.default)
            .get(`/api/exercises/${exerciseId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(getResponse.status).toBe(404);
    }));
});
