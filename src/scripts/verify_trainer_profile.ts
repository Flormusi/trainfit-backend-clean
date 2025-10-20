import dotenv from 'dotenv';
dotenv.config();
import app from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = `trainer.${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Auto Test Trainer';

    // Register a new trainer
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password, role: 'TRAINER' });
    console.log('Register status:', registerRes.status);
    if (registerRes.status !== 201) {
      console.error('Register failed:', registerRes.body);
      return;
    }
    const token = registerRes.body.token;
    console.log('Token length:', token?.length);

    // Initial GET profile
    let getRes = await request(app)
      .get('/api/trainer/profile')
      .set('Authorization', `Bearer ${token}`);
    console.log('GET /api/trainer/profile status:', getRes.status);
    console.log('Initial trainerProfile:', getRes.body?.trainerProfile);

    // First PUT update
    const value1 = 2.5;
    let putRes = await request(app)
      .put('/api/trainer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ defaultPercentIncrement: value1 });
    console.log('PUT /api/trainer/profile status:', putRes.status);

    // Verify after first update
    getRes = await request(app)
      .get('/api/trainer/profile')
      .set('Authorization', `Bearer ${token}`);
    console.log('After first update trainerProfile:', getRes.body?.trainerProfile);

    // Second PUT update
    const value2 = 5;
    putRes = await request(app)
      .put('/api/trainer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ defaultPercentIncrement: value2 });
    console.log('PUT (second) /api/trainer/profile status:', putRes.status);

    // Verify after second update
    getRes = await request(app)
      .get('/api/trainer/profile')
      .set('Authorization', `Bearer ${token}`);
    console.log('After second update trainerProfile:', getRes.body?.trainerProfile);
  } catch (e) {
    console.error('Error running verification script:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();