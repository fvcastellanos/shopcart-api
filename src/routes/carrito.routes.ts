import { Router } from 'express';
import * as carritoController from '../controllers/carrito.controller.js';
import { authenticateOptional } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  actualizarItemSchema,
  agregarItemSchema,
  carritoItemParamsSchema,
  crearCarritoSchema,
} from '../schemas/carrito.schema.js';

/**
 * @swagger
 * /carrito:
 *   post:
 *     summary: Crea un carrito (invitado o autenticado)
 *     tags: [Carrito]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string, description: Token para carrito de invitado }
 *     responses:
 *       201:
 *         description: Carrito creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CarritoDto' }
 * /carrito/{id}:
 *   get:
 *     summary: Obtiene los ítems y el subtotal del carrito
 *     tags: [Carrito]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Ítems y subtotal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CarritoItemDto' }
 *                 subtotal: { type: number }
 * /carrito/{id}/items:
 *   post:
 *     summary: Agrega un ítem al carrito
 *     tags: [Carrito]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idVariante, cantidad]
 *             properties:
 *               idVariante: { type: integer }
 *               cantidad: { type: integer }
 *     responses:
 *       201:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CarritoItemDto' }
 *                 subtotal: { type: number }
 *       400: { description: Existencia insuficiente }
 *   delete:
 *     summary: Vacía el carrito
 *     tags: [Carrito]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Carrito vaciado }
 * /carrito/{id}/items/{idVariante}:
 *   put:
 *     summary: Actualiza la cantidad de un ítem
 *     tags: [Carrito]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: idVariante, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cantidad]
 *             properties:
 *               cantidad: { type: integer }
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CarritoItemDto' }
 *                 subtotal: { type: number }
 *   delete:
 *     summary: Elimina un ítem del carrito
 *     tags: [Carrito]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: idVariante, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Ítem eliminado }
 */
export const carritoRouter = Router();

carritoRouter.post(
  '/',
  authenticateOptional,
  validate({ body: crearCarritoSchema }),
  carritoController.crear,
);
carritoRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  carritoController.obtenerItems,
);
carritoRouter.post(
  '/:id/items',
  validate({ params: idParamSchema, body: agregarItemSchema }),
  carritoController.agregarItem,
);
carritoRouter.put(
  '/:id/items/:idVariante',
  validate({ params: carritoItemParamsSchema, body: actualizarItemSchema }),
  carritoController.actualizarItem,
);
carritoRouter.delete(
  '/:id/items/:idVariante',
  validate({ params: carritoItemParamsSchema }),
  carritoController.eliminarItem,
);
carritoRouter.delete(
  '/:id/items',
  validate({ params: idParamSchema }),
  carritoController.limpiar,
);
