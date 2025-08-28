import { Application } from 'express';
import authRoutes from '../routes/auth';
import jobRoutes from '../routes/jobs';

export const configureRoutes = (app: Application): void => {
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobRoutes);

  // API documentation
  app.get('/api', (_req, res) => {
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
};