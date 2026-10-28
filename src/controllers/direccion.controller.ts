import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as direccionService from '../services/direccion.service.js';

export const listarPorUsuario = asyncHandler(async (req: Request, res: Response) => {
  const direcciones = await direccionService.listarPorUsuario(req.user!.id);
  res.json(direcciones);
});

export const crear = asyncHandler(async (req: Request, res: Response) => {
  const direccion = await direccionService.crear(req.user!.id, req.body);
  res.status(201).json(direccion);
});

export const modificar = asyncHandler(async (req: Request, res: Response) => {
  const direccion = await direccionService.modificar(Number(req.params.id), req.body);
  res.json(direccion);
});

export const desactivar = asyncHandler(async (req: Request, res: Response) => {
  await direccionService.desactivar(Number(req.params.id));
  res.status(204).send();
});
