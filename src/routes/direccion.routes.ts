import { Router } from 'express';
import * as direccionController from '../controllers/direccion.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearDireccionSchema } from '../schemas/direccion.schema.js';

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
