import { Router, Request, Response, NextFunction } from 'express';
import { intakeService } from '../services/intake.service.js';
import { authenticate } from '../middleware/auth.js';
import { createSuccessResponse } from '../middleware/response.js';

export const intakeRouter = Router();

intakeRouter.post('/submit', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = intakeService.submitIntake(req.user!.id, req.body);
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

intakeRouter.get('/:id/summary', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = intakeService.getIntakeSummary(String(req.params.id));
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

intakeRouter.get('/:id/practice-areas', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = intakeService.getIntakePracticeAreas(String(req.params.id));
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});
