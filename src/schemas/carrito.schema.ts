import { z } from 'zod';

export const crearCarritoSchema = z.object({
  token: z.string().min(1).max(64).optional(),
});

export const carritoItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  idVariante: z.coerce.number().int().positive(),
});

export const agregarItemSchema = z.object({
  idVariante: z.number().int().positive(),
  cantidad: z.number().int().positive(),
});

export const actualizarItemSchema = z.object({
  cantidad: z.number().int().positive(),
});
