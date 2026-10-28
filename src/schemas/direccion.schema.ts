import { z } from 'zod';

export const crearDireccionSchema = z.object({
  linea1: z.string().min(1).max(200),
  linea2: z.string().max(200).nullable().optional(),
  ciudad: z.string().min(1).max(100),
  departamento: z.string().min(1).max(100),
  codigoPostal: z.string().min(1).max(20),
  referencia: z.string().max(255).nullable().optional(),
  esPrincipal: z.boolean().optional(),
});
