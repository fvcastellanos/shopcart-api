import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const ventasPorPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta, agruparPor = 'Dia' } = req.query as unknown as {
    fechaDesde: Date;
    fechaHasta: Date;
    agruparPor?: string;
  };
  const resultado = await dashboardService.ventasPorPeriodo(fechaDesde, fechaHasta, agruparPor);
  res.json(resultado);
});

export const productosMasVendidos = asyncHandler(async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta, top = 10 } = req.query as unknown as {
    fechaDesde: Date;
    fechaHasta: Date;
    top?: number;
  };
  const resultado = await dashboardService.productosMasVendidos(fechaDesde, fechaHasta, top);
  res.json(resultado);
});

export const resumen = asyncHandler(async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta } = req.query as unknown as {
    fechaDesde: Date;
    fechaHasta: Date;
  };
  const resultado = await dashboardService.resumen(fechaDesde, fechaHasta);
  res.json(resultado);
});
