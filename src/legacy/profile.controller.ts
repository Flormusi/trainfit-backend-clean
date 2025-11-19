import { Request, Response } from 'express';
import Profile from '../models/profile.model';
import User, { IUser } from '../models/user.model'; // Import IUser

// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: (req as any).user.id });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
      return; // <--- AÑADIDO
    }

    res.status(200).json({
      success: true,
      data: profile
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  }
};

// @desc    Create user profile
// @route   POST /api/profile
// @access  Private
export const createProfile = async (req: Request, res: Response) => {
  try {
    // Check if profile already exists
    const existingProfile = await Profile.findOne({ user: (req as any).user.id });
    
    if (existingProfile) {
      res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
      return; // <--- AÑADIDO
    }

    // Create profile
    const profileData = {
      ...req.body,
      user: (req as any).user.id
    };
    
    const profile = await Profile.create(profileData);

    // Update user to mark profile as completed
    await User.findByIdAndUpdate((req as any).user.id, {
      hasCompletedProfile: true
    });

    res.status(201).json({
      success: true,
      data: profile
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: (req as any).user.id },
      req.body,
      {
        new: true,
        runValidators: true,
        upsert: true // Nota: upsert: true puede crear el documento si no existe.
      }
    );

    // Si findOneAndUpdate con upsert:true crea el documento, 'profile' contendrá el nuevo documento.
    // Si actualiza uno existente, 'profile' contendrá el documento actualizado (debido a new: true).
    // Por lo tanto, 'profile' no debería ser null aquí si la operación tiene éxito.
    // La lógica original de 'if (!profile)' para actualizar 'hasCompletedProfile' podría necesitar revisión
    // si el objetivo era solo hacerlo en la creación. Con upsert, es más complejo.
    // Por ahora, nos enfocamos en el tipo de retorno.

    // Asumiendo que si el perfil se crea o actualiza, queremos marcar hasCompletedProfile
    // Esta lógica podría necesitar ser más específica si solo es en la creación inicial.
    await User.findByIdAndUpdate((req as any).user.id, {
      hasCompletedProfile: true
    });


    res.status(200).json({
      success: true,
      data: profile // 'profile' será el documento creado o actualizado
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
    return; // <--- AÑADIDO por consistencia y seguridad
  }
};

// @desc    Get all client profiles (for trainers)
// @route   GET /api/profile/clients
// @access  Private/Trainer
export const getClientProfiles = async (req: Request, res: Response) => {
  try {
    // Find all users with role 'client'
    const clients: IUser[] = await User.find({ role: 'client' }); 
    
    // Get their profiles
    const clientIds = clients.map(client => client._id); 
    const profiles = await Profile.find({ user: { $in: clientIds } });

    // Combine user and profile data
    const clientProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = clients.find((client: IUser) => 
          // Workaround: Cast client to 'any' before accessing _id
          (client as any)._id.toString() === profile.user.toString() 
        );
        
        return {
          user: {
            // Apply 'as any' here as well if 'user' is found but its properties are unknown
            id: user ? (user as any)._id : undefined, 
            name: user ? (user as any).name : undefined,
            email: user ? (user as any).email : undefined,
            hasCompletedOnboarding: user ? (user as any).hasCompletedOnboarding : undefined
          },
          profile
        };
      })
    );

    res.status(200).json({
      success: true,
      count: clientProfiles.length,
      data: clientProfiles
    });
    return; 
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
    return; 
  }
};