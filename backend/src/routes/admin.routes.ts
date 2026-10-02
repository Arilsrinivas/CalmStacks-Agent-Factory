import { Router, Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createSuccessResponse } from '../middleware/response.js';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate);
adminRouter.use(requireRole('admin'));

adminRouter.get('/advocates/pending', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pendingAdvocates = adminService.listPendingAdvocates();
    res.status(200).json(createSuccessResponse(pendingAdvocates));
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/advocates/:id/verify', (req: Request, res: Response, next: NextFunction) => {
  try {
    const verifiedAdvocate = adminService.verifyAdvocate(String(req.params.id), req.body);
    res.status(200).json(createSuccessResponse(verifiedAdvocate));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/analytics', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = adminService.getAnalytics();
    res.status(200).json(createSuccessResponse(analytics));
  } catch (error) {
    next(error);
  }
});
