import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.register(req.body);
  res.status(201).json(tokens);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.login(req.body);
  res.status(200).json(tokens);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.status(200).json(tokens);
});
