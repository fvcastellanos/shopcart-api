import { z } from 'zod';

export const listarCategoriasQuerySchema = z.object({
  activas: z.enum(['true', 'false', '1', '0']).optional(),
});

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
});

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
