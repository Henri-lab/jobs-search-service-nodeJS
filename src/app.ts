import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { loggerFormat } from './middleware/logger';

// Import routes
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';

// Import database connection
import connectDB from './config/database';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env['PORT'] || '3000');
    
    this.initializeDatabase();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    await connectDB();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: '请求过于频繁，请稍后再试',
        retryAfter: '15分钟后重试'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env['NODE_ENV'] !== 'test') {
      this.app.use(loggerFormat);
    }

    // Trust proxy (for deployment behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/jobs', jobRoutes);

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        message: 'Jobs Search API',
        version: '1.0.0',
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login'
          },
          jobs: {
            list: 'GET /api/jobs',
            detail: 'GET /api/jobs/:id',
            stats: 'GET /api/jobs/stats'
          }
        },
        documentation: 'https://github.com/your-repo/jobs-search-api'
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`
╔═══════════════════════════════════════╗
║          Jobs Search API              ║
║                                       ║
║  🚀 Server running on port ${this.port}        ║
║  📝 Environment: ${process.env['NODE_ENV']?.padEnd(13) || 'development'}    ║
║  🌐 Health check: /health             ║
║  📚 API docs: /api                    ║
║                                       ║
║  Ready to accept connections! 🎉      ║
╚═══════════════════════════════════════╝
      `);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  app.listen();
}

export default app;