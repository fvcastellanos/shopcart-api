import { Router } from 'express';
import * as inventarioController from '../controllers/inventario.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  listarKardexQuerySchema,
  registrarAjusteSchema,
  registrarEntradaSchema,
} from '../schemas/inventario.schema.js';

export const inventarioRouter = Router();

const equipo = [authenticate, authorize('Operador', 'Administrador')];

inventarioRouter.get(
  '/:id/existencia',
  ...equipo,
  validate({ params: idParamSchema }),
  inventarioController.consultarExistencia,
);
inventarioRouter.get(
  '/:id/kardex',
  ...equipo,
  validate({ params: idParamSchema, query: listarKardexQuerySchema }),
  inventarioController.listarKardex,
);
inventarioRouter.post(
  '/:id/entradas',
  ...equipo,
  validate({ params: idParamSchema, body: registrarEntradaSchema }),
  inventarioController.registrarEntrada,
);
inventarioRouter.post(
  '/:id/ajustes',
  ...equipo,
  validate({ params: idParamSchema, body: registrarAjusteSchema }),
  inventarioController.registrarAjuste,
);
