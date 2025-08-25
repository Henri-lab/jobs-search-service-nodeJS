import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateToken = (userId: string): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const expiresIn = (process.env['JWT_EXPIRES_IN'] || '24h') as `${number}`;
  const options: SignOptions = { expiresIn };

  return jwt.sign({ userId }, secret, options);
};

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: '未提供访问令牌' });
      return;
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      res.status(500).json({ message: '服务器配置错误' });
      return;
    }

    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({ message: '无效的访问令牌' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: '无效的访问令牌' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: '需要管理员权限' });
    return;
  }
  next();
};