import { Router } from 'express';
import * as bitacoraController from '../controllers/bitacora.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listarBitacoraQuerySchema } from '../schemas/bitacora.schema.js';

/**
 * @swagger
 * /bitacora:
 *   get:
 *     summary: Consulta la bitácora de auditoría
 *     tags: [Bitácora]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: entidad, schema: { type: string } }
 *       - { in: query, name: idUsuario, schema: { type: integer } }
 *       - { in: query, name: fechaDesde, schema: { type: string, format: date-time } }
 *       - { in: query, name: fechaHasta, schema: { type: string, format: date-time } }
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: tamanoPagina, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Registros de auditoría paginados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/BitacoraDto' }
 *       403: { description: No autorizado (solo Administrador) }
 */
export const bitacoraRouter = Router();

bitacoraRouter.get(
  '/',
  authenticate,
  authorize('Administrador'),
  validate({ query: listarBitacoraQuerySchema }),
  bitacoraController.listar,
);
