import { Router } from 'express';
import * as productoController from '../controllers/producto.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearProductoSchema, listarProductosQuerySchema } from '../schemas/producto.schema.js';

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Lista productos (búsqueda, filtros, orden y paginación)
 *     tags: [Catálogo]
 *     parameters:
 *       - { in: query, name: busqueda, schema: { type: string } }
 *       - { in: query, name: categoria, schema: { type: integer } }
 *       - { in: query, name: precioMin, schema: { type: number } }
 *       - { in: query, name: precioMax, schema: { type: number } }
 *       - { in: query, name: soloDisponibles, schema: { type: string, enum: ['true', 'false', '1', '0'] } }
 *       - { in: query, name: ordenarPor, schema: { type: string, enum: [Nombre, Precio, Recientes] } }
 *       - { in: query, name: direccion, schema: { type: string, enum: [ASC, DESC] } }
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: tamanoPagina, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Lista de productos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductoDto' }
 *   post:
 *     summary: Crea un producto
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductoRequest' }
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductoDto' }
 *       403: { description: No autorizado (solo Administrador) }
 * /productos/{id}:
 *   get:
 *     summary: Consulta un producto con sus variantes
 *     tags: [Catálogo]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Producto y variantes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductoDto' }
 *       404: { description: Producto no encontrado }
 *   put:
 *     summary: Modifica un producto
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductoRequest' }
 *     responses:
 *       200:
 *         description: Producto modificado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductoDto' }
 *   delete:
 *     summary: Desactiva un producto
 *     tags: [Catálogo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Producto desactivado }
 */
export const productoRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Público (tienda)
productoRouter.get(
  '/',
  validate({ query: listarProductosQuerySchema }),
  productoController.listarProductos,
);
productoRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  productoController.consultarProducto,
);

// Administrador
productoRouter.post(
  '/',
  ...admin,
  validate({ body: crearProductoSchema }),
  productoController.crearProducto,
);
productoRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: crearProductoSchema }),
  productoController.modificarProducto,
);
productoRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  productoController.desactivarProducto,
);
