import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  message: string;
  status: number;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, status: number = 500, isOperational: boolean = true) {
    super(message);
    
    this.status = status;
    this.isOperational = isOperational;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let isOperational = false;

  if (error instanceof AppError) {
    statusCode = error.status;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    statusCode = 500;
    message = '数据库操作失败';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的访问令牌';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '访问令牌已过期';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = '无效的请求参数';
  }

  const errorResponse: ErrorResponse = {
    message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // 在开发环境下包含错误堆栈
  if (process.env['NODE_ENV'] === 'development'&& error.stack) {
    errorResponse.stack = error.stack;
  }

  // 记录错误日志
  if (!isOperational || statusCode >= 500) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`找不到请求的资源: ${req.originalUrl}`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};