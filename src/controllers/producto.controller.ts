import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as productoService from '../services/producto.service.js';
import type { ListarProductosQuery } from '../schemas/producto.schema.js';

export const listarProductos = asyncHandler(async (req: Request, res: Response) => {
  const productos = await productoService.listarProductos(
    req.query as unknown as ListarProductosQuery,
  );
  const total = productos[0]?.totalRegistros ?? 0;
  const items = productos.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});

export const consultarProducto = asyncHandler(async (req: Request, res: Response) => {
  const producto = await productoService.consultarProductoConVariantes(Number(req.params.id));
  res.json(producto);
});

export const crearProducto = asyncHandler(async (req: Request, res: Response) => {
  const producto = await productoService.crearProducto(req.body, req.user!.id);
  res.status(201).json(producto);
});

export const modificarProducto = asyncHandler(async (req: Request, res: Response) => {
  const producto = await productoService.modificarProducto(
    Number(req.params.id),
    req.body,
    req.user!.id,
  );
  res.json(producto);
});

export const desactivarProducto = asyncHandler(async (req: Request, res: Response) => {
  await productoService.desactivarProducto(Number(req.params.id), req.user!.id);
  res.status(204).send();
});
