import type { Request, Response } from 'express';
import { buildInfo } from '../../lib/buildInfo.js';

export function info(_req: Request, res: Response): void {
  res.status(200).json(buildInfo);
}
