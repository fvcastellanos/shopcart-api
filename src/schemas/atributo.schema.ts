import { z } from 'zod';

export const listarAtributosQuerySchema = z.object({
  activas: z.enum(['true', 'false', '1', '0']).optional(),
});

export const crearAtributoSchema = z.object({
  nombre: z.string().min(1).max(50),
});

export type CrearAtributoInput = z.infer<typeof crearAtributoSchema>;
