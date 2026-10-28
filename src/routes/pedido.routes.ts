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

export const pedidoRouter = Router();

const equipo = [authenticate, authorize('Operador', 'Administrador')];

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
