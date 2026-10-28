import { Router } from 'express';
import * as productoController from '../controllers/producto.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearProductoSchema, listarProductosQuerySchema } from '../schemas/producto.schema.js';

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
