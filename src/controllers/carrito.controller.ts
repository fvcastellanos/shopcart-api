import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as carritoService from '../services/carrito.service.js';

export const crear = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = req.user?.id ?? null;
  const token = req.body.token ?? null;
  const carrito = await carritoService.crear(idUsuario, token);
  res.status(201).json(carrito);
});

export const obtenerItems = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await carritoService.obtenerItems(Number(req.params.id));
  res.json(resultado);
});

export const agregarItem = asyncHandler(async (req: Request, res: Response) => {
  await carritoService.agregarItem(
    Number(req.params.id),
    req.body.idVariante,
    req.body.cantidad,
  );
  const resultado = await carritoService.obtenerItems(Number(req.params.id));
  res.status(201).json(resultado);
});

export const actualizarItem = asyncHandler(async (req: Request, res: Response) => {
  await carritoService.actualizarItem(
    Number(req.params.id),
    Number(req.params.idVariante),
    req.body.cantidad,
  );
  const resultado = await carritoService.obtenerItems(Number(req.params.id));
  res.json(resultado);
});

export const eliminarItem = asyncHandler(async (req: Request, res: Response) => {
  await carritoService.eliminarItem(Number(req.params.id), Number(req.params.idVariante));
  res.status(204).send();
});

export const limpiar = asyncHandler(async (req: Request, res: Response) => {
  await carritoService.limpiar(Number(req.params.id));
  res.status(204).send();
});
