import { Router } from 'express';
import * as inventarioController from '../controllers/inventario.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  listarKardexQuerySchema,
  registrarAjusteSchema,
  registrarEntradaSchema,
} from '../schemas/inventario.schema.js';

/**
 * @swagger
 * /inventario/{id}/existencias:
 *   get:
 *     summary: Consulta la existencia (física, reservada y disponible) de una variante
 *     tags: [Inventario]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Existencia de la variante
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ExistenciaDto' }
 * /inventario/{id}/kardex:
 *   get:
 *     summary: Lista los movimientos de kardex de una variante
 *     tags: [Inventario]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: tamanoPagina, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Movimientos de kardex paginados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/KardexDto' }
 * /inventario/{id}/entradas:
 *   post:
 *     summary: Registra una entrada por compra
 *     tags: [Inventario]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cantidad]
 *             properties:
 *               cantidad: { type: integer }
 *               motivo: { type: string }
 *     responses:
 *       201:
 *         description: Entrada registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 existenciaNueva: { type: integer }
 * /inventario/{id}/ajustes:
 *   post:
 *     summary: Registra un ajuste manual (requiere motivo)
 *     tags: [Inventario]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cantidad, motivo]
 *             properties:
 *               cantidad: { type: integer, description: Puede ser negativa }
 *               motivo: { type: string }
 *     responses:
 *       200:
 *         description: Ajuste registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 existenciaNueva: { type: integer }
 *       400: { description: El ajuste no puede dejar existencia negativa }
 */
export const inventarioRouter = Router();

const equipo = [authenticate, authorize('Operador', 'Administrador')];

inventarioRouter.get(
  '/:id/existencias',
  ...equipo,
  validate({ params: idParamSchema }),
  inventarioController.consultarExistencia,
);
inventarioRouter.get(
  '/:id/kardex',
  ...equipo,
  validate({ params: idParamSchema, query: listarKardexQuerySchema }),
  inventarioController.listarKardex,
);
inventarioRouter.post(
  '/:id/entradas',
  ...equipo,
  validate({ params: idParamSchema, body: registrarEntradaSchema }),
  inventarioController.registrarEntrada,
);
inventarioRouter.post(
  '/:id/ajustes',
  ...equipo,
  validate({ params: idParamSchema, body: registrarAjusteSchema }),
  inventarioController.registrarAjuste,
);
