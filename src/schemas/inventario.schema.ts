import { z } from 'zod';

export const registrarEntradaSchema = z.object({
  cantidad: z.number().int().positive(),
  motivo: z.string().max(255).optional(),
});

export const registrarAjusteSchema = z.object({
  cantidad: z.number().int(),
  motivo: z.string().min(1).max(255),
});

export const listarKardexQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().optional(),
  tamanoPagina: z.coerce.number().int().positive().max(100).optional(),
});
