import { Router } from 'express';
import * as cuponController from '../controllers/cupon.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearCuponSchema, listarCuponesQuerySchema } from '../schemas/cupon.schema.js';

/**
 * @swagger
 * /cupones:
 *   get:
 *     summary: Lista cupones
 *     tags: [Cupones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: busqueda, schema: { type: string } }
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: tamanoPagina, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Lista de cupones paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CuponDto' }
 *   post:
 *     summary: Crea un cupón
 *     tags: [Cupones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CuponRequest' }
 *     responses:
 *       201:
 *         description: Cupón creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CuponDto' }
 *       422: { description: Código duplicado }
 * /cupones/codigo/{codigo}:
 *   get:
 *     summary: Consulta un cupón por código
 *     tags: [Cupones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: codigo, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Cupón encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CuponDto' }
 * /cupones/{id}:
 *   put:
 *     summary: Modifica un cupón
 *     tags: [Cupones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CuponRequest' }
 *     responses:
 *       200:
 *         description: Cupón modificado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CuponDto' }
 *   delete:
 *     summary: Desactiva un cupón
 *     tags: [Cupones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Cupón desactivado }
 */
export const cuponRouter = Router();

const admin = [authenticate, authorize('Administrador')];

cuponRouter.get('/', ...admin, validate({ query: listarCuponesQuerySchema }), cuponController.listar);
cuponRouter.get('/codigo/:codigo', ...admin, cuponController.consultarPorCodigo);
cuponRouter.post('/', ...admin, validate({ body: crearCuponSchema }), cuponController.crear);
cuponRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: crearCuponSchema }),
  cuponController.modificar,
);
cuponRouter.delete('/:id', ...admin, validate({ params: idParamSchema }), cuponController.desactivar);
