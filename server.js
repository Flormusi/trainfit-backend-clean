require('dotenv').config();
console.log('Environment variables loaded, PORT =', process.env.PORT);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3002', // <-- aquí va el puerto de tu frontend
  credentials: true
}));
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Route mounting
try {
  const authRoutes = require('./dist/routes/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes mounted successfully');
} catch (error) {
  console.error('Error mounting auth routes:', error);
}

// ✅ Health check route
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint accessed');
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
  process.exit(1);
});
