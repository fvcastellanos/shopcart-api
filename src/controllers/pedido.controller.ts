import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as pedidoService from '../services/pedido.service.js';
import type { ListarPedidosQuery } from '../schemas/pedido.schema.js';

export const crearPedido = asyncHandler(async (req: Request, res: Response) => {
  const pedido = await pedidoService.crearPedido(req.body, req.user!.id);
  res.status(201).json(pedido);
});

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListarPedidosQuery;
  const pedidos = await pedidoService.listar({
    estado: query.estado,
    idUsuario: query.idUsuario,
    fechaDesde: query.fechaDesde,
    fechaHasta: query.fechaHasta,
    pagina: query.pagina,
    tamanoPagina: query.tamanoPagina,
  });
  const total = pedidos[0]?.totalRegistros ?? 0;
  const items = pedidos.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});

export const listarMios = asyncHandler(async (req: Request, res: Response) => {
  const pagina = Number(req.query.pagina ?? 1);
  const tamanoPagina = Number(req.query.tamanoPagina ?? 10);
  const pedidos = await pedidoService.listarPorCliente(req.user!.id, pagina, tamanoPagina);
  const total = pedidos[0]?.totalRegistros ?? 0;
  const items = pedidos.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});

export const consultar = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await pedidoService.consultar(Number(req.params.id), req.user!);
  res.json(resultado);
});

export const cambiarEstado = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await pedidoService.cambiarEstado(
    Number(req.params.id),
    req.body.estadoNuevo,
    req.user!.id,
  );
  res.json(resultado);
});

export const registrarDevolucion = asyncHandler(async (req: Request, res: Response) => {
  await pedidoService.registrarDevolucion(Number(req.params.id), req.body.lineas, req.user!.id);
  res.status(204).send();
});
