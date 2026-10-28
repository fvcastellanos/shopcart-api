import { z } from 'zod';

export const reservarSchema = z.object({
  idCarrito: z.number().int().positive(),
  duracionMinutos: z.number().int().positive().max(120).optional(),
});
