import express, { Response } from 'express';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import User from '../models/User';

const router = express.Router();

router.get('/:clientId', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.clientId).select('name email role');

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return; // Add explicit return to make it void
    }

    res.json(user);
    // No explicit return here, so it's implicitly void for this path

  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
    // No explicit return here, implicitly void for this path too
  }
});

export default router;