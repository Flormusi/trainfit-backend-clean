import express, { Router } from 'express'; // Changed this line
import { registerUser, login, getCurrentUser, forgotPassword, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware'; // Asegúrate que protect está importado si lo usas

const router = express.Router();

// Auth routes
router.post('/register', registerUser); // Corrected to use registerUser
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.post('/forgotpassword', forgotPassword);
router.put('/updateprofile', protect, updateProfile);

export default router;