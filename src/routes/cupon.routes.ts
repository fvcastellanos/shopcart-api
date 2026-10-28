import { Router } from 'express';
import * as cuponController from '../controllers/cupon.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearCuponSchema, listarCuponesQuerySchema } from '../schemas/cupon.schema.js';

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
