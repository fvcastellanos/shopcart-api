import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as bitacoraService from '../services/bitacora.service.js';

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { entidad, idUsuario, fechaDesde, fechaHasta, pagina, tamanoPagina } =
    req.query as unknown as {
      entidad?: string;
      idUsuario?: number;
      fechaDesde?: Date;
      fechaHasta?: Date;
      pagina?: number;
      tamanoPagina?: number;
    };
  const registros = await bitacoraService.listar({
    entidad,
    idUsuario,
    fechaDesde,
    fechaHasta,
    pagina,
    tamanoPagina,
  });
  const total = registros[0]?.totalRegistros ?? 0;
  const items = registros.map(({ totalRegistros: _total, ...resto }) => resto);
  res.json({ total, items });
});
