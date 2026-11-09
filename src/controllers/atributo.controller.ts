import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as atributoService from '../services/atributo.service.js';

export const listarAtributos = asyncHandler(async (req: Request, res: Response) => {
  const activas = req.query.activas === 'true' || req.query.activas === '1';
  const atributos = await atributoService.listarAtributos(activas);
  res.json(atributos);
});

export const crearAtributo = asyncHandler(async (req: Request, res: Response) => {
  const atributo = await atributoService.crearAtributo(req.body.nombre, req.user!.id);
  res.status(201).json(atributo);
});

export const modificarAtributo = asyncHandler(async (req: Request, res: Response) => {
  const atributo = await atributoService.modificarAtributo(
    Number(req.params.id),
    req.body.nombre,
    req.user!.id,
  );
  res.json(atributo);
});

export const desactivarAtributo = asyncHandler(async (req: Request, res: Response) => {
  await atributoService.desactivarAtributo(Number(req.params.id), req.user!.id);
  res.status(204).send();
});
