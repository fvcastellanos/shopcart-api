import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  productosMasVendidosQuerySchema,
  resumenQuerySchema,
  ventasPorPeriodoQuerySchema,
} from '../schemas/dashboard.schema.js';

export const dashboardRouter = Router();

const admin = [authenticate, authorize('Administrador')];

dashboardRouter.get(
  '/ventas-por-periodo',
  ...admin,
  validate({ query: ventasPorPeriodoQuerySchema }),
  dashboardController.ventasPorPeriodo,
);
dashboardRouter.get(
  '/productos-mas-vendidos',
  ...admin,
  validate({ query: productosMasVendidosQuerySchema }),
  dashboardController.productosMasVendidos,
);
dashboardRouter.get(
  '/resumen',
  ...admin,
  validate({ query: resumenQuerySchema }),
  dashboardController.resumen,
);
