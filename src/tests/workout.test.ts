import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import User from '../models/user.model';
import Workout from '../models/workout.model';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create a test user and get token
  const userData = {
    name: 'Workout Test User',
    email: 'workout@example.com',
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

describe('Workout Routes', () => {
  it('should create a new workout', async () => {
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

    const response = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Test Workout');
    expect(response.body.data.exercises).toHaveLength(2);
  });

  it('should get all workouts', async () => {
    const response = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.data)).toBeTruthy();
  });

  it('should get a single workout by ID', async () => {
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

    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutData);

    const workoutId = createResponse.body.data._id;

    // Then get the workout by ID
    const response = await request(app)
      .get(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Single Workout Test');
  });

  it('should update a workout', async () => {
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

    const createResponse = await request(app)
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

    const response = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Updated Workout');
    expect(response.body.data).toHaveProperty('description', 'This workout has been updated');
    expect(response.body.data).toHaveProperty('difficulty', 'intermediate');
  });

  it('should delete a workout', async () => {
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

    const createResponse = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(workoutData);

    const workoutId = createResponse.body.data._id;

    // Then delete the workout
    const response = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    // Verify the workout is deleted
    const getResponse = await request(app)
      .get(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });
});