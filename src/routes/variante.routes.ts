import { Router } from 'express';
import * as varianteController from '../controllers/variante.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  agregarAtributoVarianteSchema,
  crearVarianteSchema,
  modificarAtributoVarianteSchema,
  modificarVarianteSchema,
  varianteAtributoParamsSchema,
} from '../schemas/variante.schema.js';

/**
 * @swagger
 * /variantes:
 *   post:
 *     summary: Crea una variante
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
 * /variantes/{id}/atributos:
 *   post:
 *     summary: Agrega un atributo a una variante
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarianteAtributoRequest' }
 *     responses:
 *       201:
 *         description: Atributo agregado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarianteDto' }
 * /variantes/{id}/atributos/{idAtributo}:
 *   put:
 *     summary: Modifica el valor de un atributo de una variante
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: idAtributo, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [valor]
 *             properties:
 *               valor: { type: string }
 *     responses:
 *       200:
 *         description: Atributo modificado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarianteDto' }
 *   delete:
 *     summary: Quita un atributo de una variante
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: idAtributo, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Atributo quitado }
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

// Asociación de atributos a variantes (Administrador)
varianteRouter.post(
  '/:id/atributos',
  ...admin,
  validate({ params: idParamSchema, body: agregarAtributoVarianteSchema }),
  varianteController.agregarAtributoVariante,
);
varianteRouter.put(
  '/:id/atributos/:idAtributo',
  ...admin,
  validate({ params: varianteAtributoParamsSchema, body: modificarAtributoVarianteSchema }),
  varianteController.modificarAtributoVariante,
);
varianteRouter.delete(
  '/:id/atributos/:idAtributo',
  ...admin,
  validate({ params: varianteAtributoParamsSchema }),
  varianteController.quitarAtributoVariante,
);
