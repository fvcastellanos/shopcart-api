import { z } from 'zod';

const rangoFechasQuerySchema = z.object({
  fechaDesde: z.coerce.date(),
  fechaHasta: z.coerce.date(),
});

export const ventasPorPeriodoQuerySchema = rangoFechasQuerySchema.extend({
  agruparPor: z.enum(['Dia', 'Semana', 'Mes']).optional(),
});

export const productosMasVendidosQuerySchema = rangoFechasQuerySchema.extend({
  top: z.coerce.number().int().positive().max(100).optional(),
});

export const resumenQuerySchema = rangoFechasQuerySchema;
