import { Router } from 'express';
import * as direccionController from '../controllers/direccion.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearDireccionSchema } from '../schemas/direccion.schema.js';

/**
 * @swagger
 * /direcciones:
 *   get:
 *     summary: Lista las direcciones del usuario autenticado
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de direcciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/DireccionDto' }
 *   post:
 *     summary: Crea una dirección
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DireccionRequest' }
 *     responses:
 *       201:
 *         description: Dirección creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DireccionDto' }
 * /direcciones/{id}:
 *   put:
 *     summary: Modifica una dirección
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DireccionRequest' }
 *     responses:
 *       200:
 *         description: Dirección modificada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DireccionDto' }
 *   delete:
 *     summary: Desactiva una dirección
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Dirección desactivada }
 */
export const direccionRouter = Router();

direccionRouter.get('/', authenticate, direccionController.listarPorUsuario);
direccionRouter.post(
  '/',
  authenticate,
  validate({ body: crearDireccionSchema }),
  direccionController.crear,
);
direccionRouter.put(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: crearDireccionSchema }),
  direccionController.modificar,
);
direccionRouter.delete(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  direccionController.desactivar,
);
