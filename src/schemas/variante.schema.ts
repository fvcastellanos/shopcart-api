import { z } from 'zod';

export const crearVarianteSchema = z.object({
  idProducto: z.number().int().positive(),
  sku: z.string().min(1).max(50),
  precio: z.number().nonnegative(),
  existencia: z.number().int().nonnegative(),
});

export const modificarVarianteSchema = z.object({
  precio: z.number().nonnegative(),
  existencia: z.number().int().nonnegative(),
  activo: z.boolean(),
});

export type CrearVarianteInput = z.infer<typeof crearVarianteSchema>;
export type ModificarVarianteInput = z.infer<typeof modificarVarianteSchema>;

export const agregarAtributoVarianteSchema = z.object({
  idAtributo: z.number().int().positive(),
  valor: z.string().min(1).max(100),
});

export const modificarAtributoVarianteSchema = z.object({
  valor: z.string().min(1).max(100),
});

export const varianteAtributoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  idAtributo: z.coerce.number().int().positive(),
});
