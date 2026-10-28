import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as cuponService from '../services/cupon.service.js';

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { busqueda, pagina = 1, tamanoPagina = 10 } = req.query as unknown as {
    busqueda?: string;
    pagina?: number;
    tamanoPagina?: number;
  };
  const cupones = await cuponService.listar(busqueda, pagina, tamanoPagina);
  const total = cupones[0]?.totalRegistros ?? 0;
  const items = cupones.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});

export const consultarPorCodigo = asyncHandler(async (req: Request, res: Response) => {
  const cupon = await cuponService.consultarPorCodigo(String(req.params.codigo));
  res.json(cupon);
});

export const crear = asyncHandler(async (req: Request, res: Response) => {
  const cupon = await cuponService.crear(req.body, req.user!.id);
  res.status(201).json(cupon);
});

export const modificar = asyncHandler(async (req: Request, res: Response) => {
  const cupon = await cuponService.modificar(Number(req.params.id), req.body, req.user!.id);
  res.json(cupon);
});

export const desactivar = asyncHandler(async (req: Request, res: Response) => {
  await cuponService.desactivar(Number(req.params.id), req.user!.id);
  res.status(204).send();
});
