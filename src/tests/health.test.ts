import request from 'supertest';
import express from 'express';

// Create a minimal express app for testing
const app = express();
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

describe('Health Check Endpoint', () => {
  it('should return 200 and correct message', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', message: 'Server is running' });
  });
});