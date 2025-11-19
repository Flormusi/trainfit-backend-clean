import express from 'express';
import {
    getClients,
    getClient,
    updateClientNotes,
    assignWorkout,
    addClientByTrainer
} from '../src/controllers/client.controller.ts'; 
import {
    getProfile,       
    updateProfile     
} from '../src/controllers/profile.controller.ts'; 
import { protect, authorize } from '../src/middleware/auth.middleware';

const router = express.Router();

// Rutas para la gestión de clientes por parte de un entrenador
router.route('/')
    .get(protect, authorize(['trainer', 'ADMIN']), getClients); // MODIFICADO: Sin '...'

// Nueva ruta para que un entrenador agregue un cliente
router.post('/add-by-trainer', protect, authorize(['trainer']), addClientByTrainer); // MODIFICADO: Sin '...' y 'trainer' en minúscula

router.route('/:clientId')
    .get(protect, authorize(['trainer', 'ADMIN']), getClient); // MODIFICADO: Sin '...'

router.route('/:clientId/notes')
    .put(protect, authorize(['trainer']), updateClientNotes); // MODIFICADO: Sin '...'

router.route('/:clientId/assign-workout')
    .post(protect, authorize(['trainer']), assignWorkout); // MODIFICADO: Sin '...'

// Rutas para el perfil del cliente
router.route('/:clientId/profile')
    .get(protect, authorize(['trainer', 'ADMIN', 'CLIENT']), getProfile) // MODIFICADO: Sin '...'
    .put(protect, authorize(['trainer', 'ADMIN', 'CLIENT']), updateProfile); // MODIFICADO: Sin '...'

export default router;