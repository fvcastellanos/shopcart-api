import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as inventarioService from '../services/inventario.service.js';
import { NotFoundError } from '../lib/errors.js';

export const consultarExistencia = asyncHandler(async (req: Request, res: Response) => {
  const existencia = await inventarioService.consultarExistencia(Number(req.params.id));
  if (!existencia) {
    throw new NotFoundError('Variante no encontrada.');
  }
  res.json(existencia);
});

export const listarKardex = asyncHandler(async (req: Request, res: Response) => {
  const { pagina = 1, tamanoPagina = 20 } = req.query as unknown as {
    pagina?: number;
    tamanoPagina?: number;
  };
  const kardex = await inventarioService.listarKardex(
    Number(req.params.id),
    pagina,
    tamanoPagina,
  );
  const total = kardex[0]?.totalRegistros ?? 0;
  const items = kardex.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});

export const registrarEntrada = asyncHandler(async (req: Request, res: Response) => {
  const existenciaNueva = await inventarioService.registrarEntrada(
    Number(req.params.id),
    req.body.cantidad,
    req.body.motivo ?? null,
    req.user!.id,
  );
  res.status(201).json({ existenciaNueva });
});

export const registrarAjuste = asyncHandler(async (req: Request, res: Response) => {
  const existenciaNueva = await inventarioService.registrarAjuste(
    Number(req.params.id),
    req.body.cantidad,
    req.body.motivo,
    req.user!.id,
  );
  res.json({ existenciaNueva });
});
