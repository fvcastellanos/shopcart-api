import { Router } from 'express';
import * as categoriaController from '../controllers/categoria.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearCategoriaSchema, listarCategoriasQuerySchema } from '../schemas/categoria.schema.js';

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista categorías
 *     tags: [Catálogo]
 *     parameters:
 *       - { in: query, name: activas, schema: { type: string, enum: ['true', 'false', '1', '0'] } }
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/CategoriaDto' }
 *   post:
 *     summary: Crea una categoría
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaRequest' }
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoriaDto' }
 *       403: { description: No autorizado (solo Administrador) }
 * /categorias/{id}:
 *   put:
 *     summary: Modifica una categoría
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaRequest' }
 *     responses:
 *       200:
 *         description: Categoría modificada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoriaDto' }
 *   delete:
 *     summary: Desactiva una categoría
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Categoría desactivada }
 */
export const categoriaRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Público (tienda)
categoriaRouter.get(
  '/',
  validate({ query: listarCategoriasQuerySchema }),
  categoriaController.listarCategorias,
);

// Administrador
categoriaRouter.post(
  '/',
  ...admin,
  validate({ body: crearCategoriaSchema }),
  categoriaController.crearCategoria,
);
categoriaRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: crearCategoriaSchema }),
  categoriaController.modificarCategoria,
);
categoriaRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  categoriaController.desactivarCategoria,
);
