import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-jwt-secret-key-here'
    );

    // Attach user to request
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}