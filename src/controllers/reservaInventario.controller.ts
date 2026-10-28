import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as reservaInventarioService from '../services/reservaInventario.service.js';

export const reservar = asyncHandler(async (req: Request, res: Response) => {
  const reservas = await reservaInventarioService.reservarExistencia(
    req.body.idCarrito,
    req.body.duracionMinutos ?? 15,
  );
  res.status(201).json(reservas);
});

export const liberarVencidas = asyncHandler(async (_req: Request, res: Response) => {
  await reservaInventarioService.liberarReservasVencidas();
  res.status(204).send();
});
