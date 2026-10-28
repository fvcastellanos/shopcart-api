import { z } from 'zod';

export const crearPedidoSchema = z.object({
  idCarrito: z.number().int().positive(),
  idDireccion: z.number().int().positive(),
  codigoCupon: z.string().max(50).optional(),
  claveIdempotencia: z.string().min(1).max(64),
});

export const listarPedidosQuerySchema = z.object({
  estado: z.string().max(20).optional(),
  idUsuario: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanoPagina: z.coerce.number().int().positive().max(100).optional(),
});

export const cambiarEstadoSchema = z.object({
  estadoNuevo: z.string().min(1).max(20),
});

export const devolucionSchema = z.object({
  lineas: z
    .array(
      z.object({
        idDetallePedido: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type ListarPedidosQuery = z.infer<typeof listarPedidosQuerySchema>;
