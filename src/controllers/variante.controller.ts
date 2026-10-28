import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as varianteService from '../services/variante.service.js';

export const crearVariante = asyncHandler(async (req: Request, res: Response) => {
  const variante = await varianteService.crearVariante(req.body, req.user!.id);
  res.status(201).json(variante);
});

export const modificarVariante = asyncHandler(async (req: Request, res: Response) => {
  const variante = await varianteService.modificarVariante(
    Number(req.params.id),
    req.body,
    req.user!.id,
  );
  res.json(variante);
});

export const desactivarVariante = asyncHandler(async (req: Request, res: Response) => {
  await varianteService.desactivarVariante(Number(req.params.id), req.user!.id);
  res.status(204).send();
});
