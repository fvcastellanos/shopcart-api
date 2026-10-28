import { z } from 'zod';

export const crearCuponSchema = z.object({
  codigo: z.string().min(1).max(50),
  tipo: z.enum(['Porcentaje', 'MontoFijo']),
  valor: z.number().nonnegative(),
  montoMinimo: z.number().nonnegative(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  limiteTotalUsos: z.number().int().positive().nullable().optional(),
  limiteUsoPorCliente: z.number().int().positive().nullable().optional(),
  idCategoria: z.number().int().positive().nullable().optional(),
});

export const listarCuponesQuerySchema = z.object({
  busqueda: z.string().max(100).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanoPagina: z.coerce.number().int().positive().max(100).optional(),
});
