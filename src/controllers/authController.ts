import { Request, Response } from 'express';
import Joi from 'joi';
import User from '../models/User';
import { generateToken } from '../middleware/auth';

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: '用户名或邮箱已存在' });
      return;
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id as unknown as string);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id as unknown as string);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};