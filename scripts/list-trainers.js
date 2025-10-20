const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trainfit')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define a simple User schema for the script
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});

// Create a model from the schema
const User = mongoose.model('User', UserSchema);

// Buscar trainers
const findTrainers = async () => {
  try {
    const trainers = await User.find({ role: 'trainer' }).select('name email');
    console.log('Trainers encontrados:');
    console.table(trainers);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error al buscar trainers:', error);
    mongoose.connection.close();
  }
};

findTrainers();