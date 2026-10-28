import { Router } from 'express';
import * as bitacoraController from '../controllers/bitacora.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listarBitacoraQuerySchema } from '../schemas/bitacora.schema.js';

export const bitacoraRouter = Router();

bitacoraRouter.get(
  '/',
  authenticate,
  authorize('Administrador'),
  validate({ query: listarBitacoraQuerySchema }),
  bitacoraController.listar,
);
