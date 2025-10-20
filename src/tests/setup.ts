import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up MongoDB connection for testing
beforeAll(async () => {
  const url = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trainfit_test';
  await mongoose.connect(url);
});

// Close MongoDB connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});