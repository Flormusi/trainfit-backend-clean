import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create a test user and get token
  const userData = {
    name: 'Exercise Test User',
    email: 'exercise@example.com',
    password: 'password123',
    role: 'trainer'
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  token = response.body.token;
  userId = response.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Exercise Routes', () => {
  it('should create a new exercise', async () => {
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

    const response = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send(exerciseData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('name', 'Bench Press');
    expect(response.body.data.muscleGroups).toContain('chest');
  });

  it('should get all exercises', async () => {
    const response = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.data)).toBeTruthy();
  });

  it('should get exercises by muscle group', async () => {
    // Create an exercise with biceps as a muscle group first
    await request(app)
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
    
    const res = await request(app)
      .get('/api/exercises?muscleGroups=biceps')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const hasBicepsExercise = res.body.data.some(
      (exercise: any) => exercise.muscleGroups.includes('biceps')
    );
    expect(hasBicepsExercise).toBeTruthy();
  });

  it('should get a single exercise by ID', async () => {
    // First create an exercise
    const exerciseData = {
      name: 'Squat',
      description: 'Lower your body by bending your knees',
      muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
      equipment: 'bodyweight',
      difficulty: 'beginner'
    };

    const createResponse = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send(exerciseData);

    const exerciseId = createResponse.body.data._id;

    // Then get the exercise by ID
    const response = await request(app)
      .get(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('name', 'Squat');
  });

  it('should update an exercise', async () => {
    // First create an exercise
    const exerciseData = {
      name: 'Deadlift',
      description: 'Lift a weight from the ground',
      muscleGroups: ['back', 'hamstrings', 'glutes'],
      equipment: 'barbell',
      difficulty: 'advanced'
    };

    const createResponse = await request(app)
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

    const response = await request(app)
      .put(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('name', 'Romanian Deadlift');
    expect(response.body.data).toHaveProperty('difficulty', 'intermediate');
  });

  it('should delete an exercise', async () => {
    // First create an exercise
    const exerciseData = {
      name: 'Push-up',
      description: 'Push your body up from the ground',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: 'bodyweight',
      difficulty: 'beginner'
    };

    const createResponse = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send(exerciseData);

    const exerciseId = createResponse.body.data._id;

    // Then delete the exercise
    const response = await request(app)
      .delete(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    // Verify the exercise is deleted
    const getResponse = await request(app)
      .get(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });
});