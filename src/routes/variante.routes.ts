import { Router } from 'express';
import * as varianteController from '../controllers/variante.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearVarianteSchema, modificarVarianteSchema } from '../schemas/variante.schema.js';

/**
 * @swagger
 * /variantes:
 *   post:
 *     summary: Crea una variante (con atributos)
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarianteRequest' }
 *     responses:
 *       201:
 *         description: Variante creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarianteDto' }
 *       422: { description: SKU duplicado }
 * /variantes/{id}:
 *   put:
 *     summary: Modifica precio, existencia y estado de una variante
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [precio, existencia, activo]
 *             properties:
 *               precio: { type: number }
 *               existencia: { type: integer }
 *               activo: { type: boolean }
 *     responses:
 *       200:
 *         description: Variante modificada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarianteDto' }
 *   delete:
 *     summary: Desactiva una variante
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Variante desactivada }
 */
export const varianteRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Administrador
varianteRouter.post(
  '/',
  ...admin,
  validate({ body: crearVarianteSchema }),
  varianteController.crearVariante,
);
varianteRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: modificarVarianteSchema }),
  varianteController.modificarVariante,
);
varianteRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  varianteController.desactivarVariante,
);
