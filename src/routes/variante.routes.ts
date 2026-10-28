import { Router } from 'express';
import * as varianteController from '../controllers/variante.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearVarianteSchema, modificarVarianteSchema } from '../schemas/variante.schema.js';

export const varianteRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Administrador
varianteRouter.post(
  '/',
  ...admin,
  validate({ body: crearVarianteSchema }),
  varianteController.crearVariante,
);
varianteRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: modificarVarianteSchema }),
  varianteController.modificarVariante,
);
varianteRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  varianteController.desactivarVariante,
);
