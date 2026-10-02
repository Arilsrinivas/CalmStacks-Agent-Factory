import { Router, Request, Response, NextFunction } from 'express';
import { advocateService } from '../services/advocate.service.js';
import { createSuccessResponse } from '../middleware/response.js';

export const advocateRouter = Router();

advocateRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { practice_area, city, language, min_exp, fee } = req.query;
    const advocates = advocateService.listAdvocates({
      practice_area: practice_area ? String(practice_area) : undefined,
      city: city ? String(city) : undefined,
      language: language ? String(language) : undefined,
      min_exp: min_exp !== undefined ? Number(min_exp) : undefined,
      fee: fee !== undefined ? Number(fee) : undefined,
    });
    res.status(200).json(createSuccessResponse(advocates));
  } catch (error) {
    next(error);
  }
});

advocateRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const advocate = advocateService.getAdvocateProfile(String(req.params.id));
    res.status(200).json(createSuccessResponse(advocate));
  } catch (error) {
    next(error);
  }
});

advocateRouter.get('/:id/slots', (req: Request, res: Response, next: NextFunction) => {
  try {
    const slots = advocateService.getAdvocateSlots(String(req.params.id));
    res.status(200).json(createSuccessResponse(slots));
  } catch (error) {
    next(error);
  }
});
