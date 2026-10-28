import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as categoriaService from '../services/categoria.service.js';

export const listarCategorias = asyncHandler(async (req: Request, res: Response) => {
  const activas = req.query.activas === 'true' || req.query.activas === '1';
  const categorias = await categoriaService.listarCategorias(activas);
  res.json(categorias);
});

export const crearCategoria = asyncHandler(async (req: Request, res: Response) => {
  const categoria = await categoriaService.crearCategoria(req.body.nombre, req.user!.id);
  res.status(201).json(categoria);
});

export const modificarCategoria = asyncHandler(async (req: Request, res: Response) => {
  const categoria = await categoriaService.modificarCategoria(
    Number(req.params.id),
    req.body.nombre,
    req.user!.id,
  );
  res.json(categoria);
});

export const desactivarCategoria = asyncHandler(async (req: Request, res: Response) => {
  await categoriaService.desactivarCategoria(Number(req.params.id), req.user!.id);
  res.status(204).send();
});
