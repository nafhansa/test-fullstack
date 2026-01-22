import { Request, Response, NextFunction } from 'express';

export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const internalKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_SECRET_KEY;

  if (!internalKey || internalKey !== expectedKey) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or missing X-INTERNAL-KEY header'
    });
  }

  next();
}