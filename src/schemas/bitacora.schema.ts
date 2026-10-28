import { z } from 'zod';

export const listarBitacoraQuerySchema = z.object({
  entidad: z.string().max(100).optional(),
  idUsuario: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanoPagina: z.coerce.number().int().positive().max(100).optional(),
});
