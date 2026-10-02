import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { intakeRouter } from './routes/intake.routes.js';
import { advocateRouter } from './routes/advocate.routes.js';
import { consultationRouter } from './routes/consultation.routes.js';
import { workspaceRouter } from './routes/workspace.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { createSuccessResponse } from './middleware/response.js';

export function createApp(): Express {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json(
      createSuccessResponse({
        status: 'UP',
        system: 'LegalConnect MVP REST API Gateway',
        bci_rule_36_compliant: true,
      })
    );
  });

  // Mount API v1 Routes matching contracts/api.yaml
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/intake', intakeRouter);
  app.use('/api/v1/advocates', advocateRouter);
  app.use('/api/v1/consultations', consultationRouter);
  app.use('/api/v1/workspaces', workspaceRouter);
  app.use('/api/v1/admin', adminRouter);

  // 404 Handler for unmatched routes
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
