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
        name: 'Workout Test User',
        email: 'workout@example.com',
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
describe('Workout Routes', () => {
    it('should create a new workout', () => __awaiter(void 0, void 0, void 0, function* () {
        const workoutData = {
            title: 'Test Workout',
            description: 'This is a test workout',
            exercises: [
                {
                    name: 'Push-ups',
                    sets: 3,
                    reps: 10,
                    rest: 60,
                    notes: 'Keep your core tight'
                },
                {
                    name: 'Squats',
                    sets: 4,
                    reps: 12,
                    rest: 90,
                    notes: 'Go deep'
                }
            ],
            difficulty: 'intermediate',
            duration: 45,
            category: 'strength'
        };
        const response = yield (0, supertest_1.default)(app_1.default)
            .post('/api/workouts')
            .set('Authorization', `Bearer ${token}`)
            .send(workoutData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('title', 'Test Workout');
        expect(response.body.data.exercises).toHaveLength(2);
    }));
    it('should get all workouts', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.default)
            .get('/api/workouts')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(Array.isArray(response.body.data)).toBeTruthy();
    }));
    it('should get a single workout by ID', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a workout
        const workoutData = {
            title: 'Single Workout Test',
            description: 'This is a test for getting a single workout',
            exercises: [
                {
                    name: 'Pull-ups',
                    sets: 3,
                    reps: 8,
                    rest: 60
                }
            ],
            difficulty: 'advanced',
            duration: 30,
            category: 'strength'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/workouts')
            .set('Authorization', `Bearer ${token}`)
            .send(workoutData);
        const workoutId = createResponse.body.data._id;
        // Then get the workout by ID
        const response = yield (0, supertest_1.default)(app_1.default)
            .get(`/api/workouts/${workoutId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('title', 'Single Workout Test');
    }));
    it('should update a workout', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a workout
        const workoutData = {
            title: 'Workout to Update',
            description: 'This workout will be updated',
            exercises: [
                {
                    name: 'Lunges',
                    sets: 3,
                    reps: 10,
                    rest: 60
                }
            ],
            difficulty: 'beginner',
            duration: 20,
            category: 'cardio'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/workouts')
            .set('Authorization', `Bearer ${token}`)
            .send(workoutData);
        const workoutId = createResponse.body.data._id;
        // Then update the workout
        const updateData = {
            title: 'Updated Workout',
            description: 'This workout has been updated',
            difficulty: 'intermediate'
        };
        const response = yield (0, supertest_1.default)(app_1.default)
            .put(`/api/workouts/${workoutId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('title', 'Updated Workout');
        expect(response.body.data).toHaveProperty('description', 'This workout has been updated');
        expect(response.body.data).toHaveProperty('difficulty', 'intermediate');
    }));
    it('should delete a workout', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a workout
        const workoutData = {
            title: 'Workout to Delete',
            description: 'This workout will be deleted',
            exercises: [
                {
                    name: 'Jumping Jacks',
                    sets: 3,
                    reps: 20,
                    rest: 30
                }
            ],
            difficulty: 'beginner',
            duration: 15,
            category: 'warmup'
        };
        const createResponse = yield (0, supertest_1.default)(app_1.default)
            .post('/api/workouts')
            .set('Authorization', `Bearer ${token}`)
            .send(workoutData);
        const workoutId = createResponse.body.data._id;
        // Then delete the workout
        const response = yield (0, supertest_1.default)(app_1.default)
            .delete(`/api/workouts/${workoutId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        // Verify the workout is deleted
        const getResponse = yield (0, supertest_1.default)(app_1.default)
            .get(`/api/workouts/${workoutId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(getResponse.status).toBe(404);
    }));
});
