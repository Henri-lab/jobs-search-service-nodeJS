import express, { Application } from 'express';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import configuration modules
import { configureMiddleware } from './config/middleware';
import { configureRoutes } from './config/routes';
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
    configureMiddleware(this.app);
  }

  private initializeRoutes(): void {
    configureRoutes(this.app);
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
║  🚀 Server running on port ${this.port}       ║
║  📝 Environment: ${process.env['NODE_ENV']?.padEnd(13) || 'development'}        ║
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