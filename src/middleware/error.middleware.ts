import { Request, Response, NextFunction } from 'express';

// Middleware para manejo de errores
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error atrapado en middleware:', err.message || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error'
  });
};

export default errorHandler;