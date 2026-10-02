import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { createSuccessResponse } from '../middleware/response.js';

export const authRouter = Router();

authRouter.post('/register', (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = authService.register(req.body);
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = authService.login(req.body);
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = authService.getProfile(req.user!.id);
    res.status(200).json(createSuccessResponse(profile));
  } catch (error) {
    next(error);
  }
});
