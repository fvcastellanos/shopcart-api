import { Router } from 'express';
import * as pedidoController from '../controllers/pedido.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  cambiarEstadoSchema,
  crearPedidoSchema,
  devolucionSchema,
  listarPedidosQuerySchema,
} from '../schemas/pedido.schema.js';

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crea un pedido (checkout atómico e idempotente)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PedidoRequest' }
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PedidoDto' }
 *   get:
 *     summary: Lista pedidos (filtros por estado, cliente y fechas)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: estado, schema: { type: string } }
 *       - { in: query, name: idUsuario, schema: { type: integer } }
 *       - { in: query, name: fechaDesde, schema: { type: string, format: date-time } }
 *       - { in: query, name: fechaHasta, schema: { type: string, format: date-time } }
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: tamanoPagina, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Lista de pedidos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PedidoDto' }
 * /pedidos/mios:
 *   get:
 *     summary: Lista los pedidos del cliente autenticado
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de pedidos del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PedidoDto' }
 * /pedidos/{id}:
 *   get:
 *     summary: Consulta un pedido con su detalle e historial
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Pedido con detalle e historial
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedido: { $ref: '#/components/schemas/PedidoDto' }
 *                 detalle:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/DetallePedidoDto' }
 *                 historial:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/HistorialEstadoDto' }
 *       404: { description: Pedido no encontrado }
 * /pedidos/{id}/estado:
 *   patch:
 *     summary: Cambia el estado de un pedido (transiciones validadas)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estadoNuevo]
 *             properties:
 *               estadoNuevo: { type: string }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 estado: { type: string }
 *       400: { description: Transición no permitida }
 * /pedidos/{id}/devoluciones:
 *   post:
 *     summary: Registra una devolución (total o parcial por línea)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lineas]
 *             properties:
 *               lineas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idDetallePedido: { type: integer }
 *                     cantidad: { type: integer }
 *     responses:
 *       204: { description: Devolución registrada }
 */
export const pedidoRouter = Router();

const equipo = [authenticate, authorize('Operador', 'Cliente', 'Administrador')];

pedidoRouter.post('/', authenticate, validate({ body: crearPedidoSchema }), pedidoController.crearPedido);
pedidoRouter.get('/mios', authenticate, pedidoController.listarMios);
pedidoRouter.get('/', ...equipo, validate({ query: listarPedidosQuerySchema }), pedidoController.listar);
pedidoRouter.get('/:id', authenticate, validate({ params: idParamSchema }), pedidoController.consultar);
pedidoRouter.patch(
  '/:id/estado',
  ...equipo,
  validate({ params: idParamSchema, body: cambiarEstadoSchema }),
  pedidoController.cambiarEstado,
);
pedidoRouter.post(
  '/:id/devoluciones',
  ...equipo,
  validate({ params: idParamSchema, body: devolucionSchema }),
  pedidoController.registrarDevolucion,
);
