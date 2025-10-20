// src/routes/auth.routes.ts

import { Router } from 'express';
import {
  register,
  login,
  // getMe, // Comentado porque no existe en auth.controller.ts
  // forgotPassword, // Comentado
  // resetPassword, // Comentado
  // updateProfile, // Comentado
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
// router.get('/me', protect, getMe); // Comentado
// router.post('/forgotpassword', forgotPassword); // Comentado
// router.put('/resetpassword/:resettoken', resetPassword); // Comentado
// router.put('/updateprofile', protect, updateProfile); // Comentado

export default router;