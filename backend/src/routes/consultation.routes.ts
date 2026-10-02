import { Router, Request, Response, NextFunction } from 'express';
import { consultationService } from '../services/consultation.service.js';
import { authenticate } from '../middleware/auth.js';
import { createSuccessResponse } from '../middleware/response.js';

export const consultationRouter = Router();

consultationRouter.post('/', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = consultationService.createConsultation(req.user!.id, req.body);
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

consultationRouter.get('/', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const consultations = consultationService.listConsultations(req.user!);
    res.status(200).json(createSuccessResponse(consultations));
  } catch (error) {
    next(error);
  }
});

consultationRouter.get('/:id', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const consultation = consultationService.getConsultation(String(req.params.id), req.user!);
    res.status(200).json(createSuccessResponse(consultation));
  } catch (error) {
    next(error);
  }
});

consultationRouter.patch('/:id/status', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const consultation = consultationService.updateConsultationStatus(
      String(req.params.id),
      req.body,
      req.user!
    );
    res.status(200).json(createSuccessResponse(consultation));
  } catch (error) {
    next(error);
  }
});
