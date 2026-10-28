import { z } from 'zod';

export const crearVarianteSchema = z.object({
  idProducto: z.number().int().positive(),
  sku: z.string().min(1).max(50),
  precio: z.number().nonnegative(),
  existencia: z.number().int().nonnegative(),
  atributos: z
    .array(
      z.object({
        nombre: z.string().min(1).max(50),
        valor: z.string().min(1).max(100),
      }),
    )
    .optional(),
});

export const modificarVarianteSchema = z.object({
  precio: z.number().nonnegative(),
  existencia: z.number().int().nonnegative(),
  activo: z.boolean(),
});

export type CrearVarianteInput = z.infer<typeof crearVarianteSchema>;
export type ModificarVarianteInput = z.infer<typeof modificarVarianteSchema>;
