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
