import { Router } from 'express';
import * as atributoController from '../controllers/atributo.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearAtributoSchema, listarAtributosQuerySchema } from '../schemas/atributo.schema.js';

/**
 * @swagger
 * /atributos:
 *   get:
 *     summary: Lista atributos
 *     tags: [Catálogo]
 *     parameters:
 *       - { in: query, name: activas, schema: { type: string, enum: ['true', 'false', '1', '0'] } }
 *     responses:
 *       200:
 *         description: Lista de atributos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/AtributoDto' }
 *   post:
 *     summary: Crea un atributo
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AtributoRequest' }
 *     responses:
 *       201:
 *         description: Atributo creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AtributoDto' }
 *       403: { description: No autorizado (solo Administrador) }
 * /atributos/{id}:
 *   put:
 *     summary: Modifica un atributo
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AtributoRequest' }
 *     responses:
 *       200:
 *         description: Atributo modificado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AtributoDto' }
 *   delete:
 *     summary: Desactiva un atributo
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Atributo desactivado }
 */
export const atributoRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Público (tienda)
atributoRouter.get(
  '/',
  validate({ query: listarAtributosQuerySchema }),
  atributoController.listarAtributos,
);

// Administrador
atributoRouter.post(
  '/',
  ...admin,
  validate({ body: crearAtributoSchema }),
  atributoController.crearAtributo,
);
atributoRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: crearAtributoSchema }),
  atributoController.modificarAtributo,
);
atributoRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  atributoController.desactivarAtributo,
);
