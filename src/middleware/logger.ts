import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

export interface LogRequest extends Request {
  startTime?: number;
}

// 自定义日志格式
export const loggerFormat = morgan((tokens, req: LogRequest, res: Response) => {
  const status = tokens['status']?.(req, res);
  const method = tokens['method']?.(req, res);
  const url = tokens['url']?.(req, res);
  const responseTime = tokens['response-time']?.(req, res);
  const contentLength = tokens['res']?.(req, res, 'content-length');
  const userAgent = tokens['user-agent']?.(req, res);
  const ip = req.ip || req.connection.remoteAddress;

  const statusColor = getStatusColor(parseInt(status || '0'));

  return [
    `${new Date().toISOString()}`,
    `[${method}]`,
    statusColor(status || ''),
    url,
    `${responseTime}ms`,
    contentLength ? `${contentLength}B` : '-',
    `IP:${ip}`,
    process.env['NODE_ENV'] === 'development' ? `UA:${userAgent}` : ''
  ].filter(Boolean).join(' ');
});

// 根据状态码返回颜色函数
function getStatusColor(status: number) {
  if (status >= 500) return (text: string) => `\x1b[31m${text}\x1b[0m`; // 红色
  if (status >= 400) return (text: string) => `\x1b[33m${text}\x1b[0m`; // 黄色
  if (status >= 300) return (text: string) => `\x1b[36m${text}\x1b[0m`; // 青色
  if (status >= 200) return (text: string) => `\x1b[32m${text}\x1b[0m`; // 绿色
  return (text: string) => text; // 默认颜色
}

// 请求开始时间中间件
export const requestTimer = (req: LogRequest, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  next();
};

// 自定义访问日志中间件
export const accessLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length') || 0
    };

    // 根据环境选择日志记录方式
    if (process.env['NODE_ENV'] === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      const statusColor = getStatusColor(res.statusCode);
      console.log(
        `${logData.timestamp} [${logData.method}] ${statusColor(logData.status.toString())} ${logData.url} ${logData.duration} IP:${logData.ip}`
      );
    }
  });

  next();
};