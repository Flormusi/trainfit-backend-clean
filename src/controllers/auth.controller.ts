import { Request, Response } from 'express';
import { PrismaClient, Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role: string;
  clientProfileName?: string;
  membershipTier?: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface UpdateProfileRequestBody {
  name?: string;
}

const sendTokenResponse = (user: User, statusCode: number, res: Response): void => {
  const secret = process.env.JWT_SECRET;
  const expiresInOption: string = process.env.JWT_EXPIRE || '30d';

  if (!secret) {
    console.error('JWT_SECRET no definido.');
    res.status(500).json({ success: false, message: 'Error del servidor.' });
    return;
  }

  const jwtOptions: SignOptions = {
    expiresIn: expiresInOption as any, // Workaround: Type assertion
  };

  const token = jwt.sign({ id: user.id }, secret, jwtOptions);

  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(expiresInOption) * 24 * 60 * 60 * 1000), // Assuming '30d' format, parse for cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
  // A more robust way to handle cookie expiration based on expiresInOption:
  let cookieExpiresInMs;
  if (expiresInOption.endsWith('d')) {
    cookieExpiresInMs = parseInt(expiresInOption.replace('d', '')) * 24 * 60 * 60 * 1000;
  } else if (expiresInOption.endsWith('h')) {
    cookieExpiresInMs = parseInt(expiresInOption.replace('h', '')) * 60 * 60 * 1000;
  } else if (expiresInOption.endsWith('m')) {
    cookieExpiresInMs = parseInt(expiresInOption.replace('m', '')) * 60 * 1000;
  } else {
    cookieExpiresInMs = parseInt(expiresInOption) * 1000; 
  }

 const robustCookieOptions = {
  expires: new Date(Date.now() + cookieExpiresInMs),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
  // ❌ domain eliminado para que sea dinámico
};

  const { password, resetPasswordToken, resetPasswordExpire, ...userOutput } = user;

  res.status(statusCode).cookie('token', token, robustCookieOptions).json({
    success: true,
    token,
    user: userOutput,
  });
};

// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, clientProfileName, membershipTier } = req.body as RegisterRequestBody;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role.toUpperCase() as Role;

    if (!Object.values(Role).includes(userRole)) {
      res.status(400).json({ success: false, message: 'Invalid role specified' });
      return;
    }

    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      hasCompletedOnboarding: false,
    };

    if (userRole === Role.CLIENT) {
      userData.clientProfile = {
        create: {
          name: clientProfileName || name,
          ...(membershipTier && { membershipTier }),
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { clientProfile: userRole === Role.CLIENT },
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login request received:', req.body);
    const { email, password: plainPassword } = req.body as LoginRequestBody;
    console.log('Parsed credentials - email:', email);

    if (!email || !plainPassword) {
      console.log('Login attempt failed: Missing credentials');
      res.status(400).json({ success: false, message: 'Por favor, proporciona email y contraseña' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        hasCompletedOnboarding: true,
        password: true,
        name: true
      },
    });

    if (!user) {
      console.log('Login attempt failed: User not found -', email);
      res.status(401).json({ success: false, message: 'Credenciales inválidas', error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) {
      console.log('Login attempt failed: Invalid password for user -', email);
      res.status(401).json({ success: false, message: 'Credenciales inválidas', error: 'Usuario o contraseña incorrectos' });
      return;
    }
    console.log('Login successful for user:', email);

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpireOption: string = process.env.JWT_EXPIRE || '30d';

    if (!jwtSecret) {
      console.error('JWT_SECRET no está definido.');
      res.status(500).json({ message: 'Server config error' });
      return;
    }

    const jwtOptions: SignOptions = {
      expiresIn: jwtExpireOption as any, // Workaround: Type assertion
    };

    const token = jwt.sign({ id: user.id }, jwtSecret, jwtOptions);

    const { password, ...userData } = user;

    const cookieOptions = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
  // ❌ domain eliminado
};


    res.status(200)
       .cookie('token', token, cookieOptions)
       .json({
         success: true,
         token,
         user: userData
       });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      success: false,
      message: 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate invite token for a client (called by trainer)
export const generateInviteToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const trainer = (req as any).user;

    const relation = await prisma.trainerClient.findFirst({
      where: { trainerId: trainer.id, clientId }
    });

    if (!relation) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }

    const token = crypto.randomBytes(20).toString('hex');

    await prisma.user.update({
      where: { id: clientId },
      data: { inviteToken: token }
    });

    const inviteUrl = `${process.env.FRONTEND_URL || 'https://trainfit.vercel.app'}/join/${token}`;
    res.json({ success: true, inviteUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generando el link' });
  }
};

// Activate account via invite link (called by client)
export const activateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { inviteToken: token } });

    if (!user) {
      res.status(404).json({ message: 'Link inválido o expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, inviteToken: null }
    });

    // Auto-login after activation
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const jwtOptions: SignOptions = { expiresIn: '7d' };
    const authToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, jwtOptions);

    res.json({ success: true, token: authToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error activando la cuenta' });
  }
};

// Get invite info (name) from token — no auth required
export const getInviteInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { name: true, email: true }
    });

    if (!user) {
      res.status(404).json({ message: 'Link inválido o expirado' });
      return;
    }

    res.json({ success: true, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

// Refresh Google OAuth access token using refresh_token
export const googleTokenRefresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      res.status(400).json({ message: 'refresh_token requerido' });
      return;
    }
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token,
      grant_type: 'refresh_token',
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ message: 'Error al refrescar token de Google', error: data });
      return;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error en token refresh' });
  }
};

// Exchange Google OAuth code for tokens
export const googleTokenExchange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, redirect_uri } = req.body;

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google token exchange error:', JSON.stringify(data));
      console.error('client_id present:', !!process.env.GOOGLE_CLIENT_ID, 'client_secret present:', !!process.env.GOOGLE_CLIENT_SECRET);
      res.status(response.status).json({ message: 'Error al obtener tokens de Google', error: data });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error en token exchange' });
  }
};
