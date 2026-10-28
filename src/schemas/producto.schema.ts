import { z } from 'zod';

export const listarProductosQuerySchema = z.object({
  busqueda: z.string().max(200).optional(),
  categoria: z.coerce.number().int().positive().optional(),
  precioMin: z.coerce.number().nonnegative().optional(),
  precioMax: z.coerce.number().nonnegative().optional(),
  soloDisponibles: z.enum(['true', 'false', '1', '0']).optional(),
  ordenarPor: z.enum(['Nombre', 'Precio', 'Recientes']).optional(),
  direccion: z.enum(['ASC', 'DESC']).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanoPagina: z.coerce.number().int().positive().max(100).optional(),
});

export const crearProductoSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(4000).optional(),
  idCategoria: z.number().int().positive(),
});

export type ListarProductosQuery = z.infer<typeof listarProductosQuerySchema>;
export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
