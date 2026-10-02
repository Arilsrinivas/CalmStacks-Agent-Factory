import { Router, Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { authenticate } from '../middleware/auth.js';
import { createSuccessResponse } from '../middleware/response.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = workspaceService.listWorkspaces(req.user!);
    res.status(200).json(createSuccessResponse(workspaces));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get('/:id', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = workspaceService.getWorkspace(String(req.params.id), req.user!);
    res.status(200).json(createSuccessResponse(workspace));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get('/:id/documents', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = workspaceService.listDocuments(String(req.params.id), req.user!);
    res.status(200).json(createSuccessResponse(documents));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post('/:id/documents', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = workspaceService.uploadDocument(String(req.params.id), req.user!, req.body);
    res.status(201).json(createSuccessResponse(document));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get('/:id/messages', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = workspaceService.listMessages(String(req.params.id), req.user!);
    res.status(200).json(createSuccessResponse(messages));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post('/:id/messages', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = workspaceService.sendMessage(String(req.params.id), req.user!, req.body);
    res.status(201).json(createSuccessResponse(message));
  } catch (error) {
    next(error);
  }
});
