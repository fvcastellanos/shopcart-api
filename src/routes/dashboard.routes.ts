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

/**
 * @swagger
 * /dashboard/ventas:
 *   get:
 *     summary: Ventas por día, semana o mes
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: fechaDesde, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: fechaHasta, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: agruparPor, schema: { type: string, enum: [Dia, Semana, Mes] } }
 *     responses:
 *       200:
 *         description: Serie de ventas por periodo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/VentasPeriodoDto' }
 * /dashboard/productos:
 *   get:
 *     summary: Top de productos más vendidos
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: fechaDesde, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: fechaHasta, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: top, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Productos más vendidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ProductoVendidoDto' }
 * /dashboard/resumen:
 *   get:
 *     summary: Resumen de ventas (total, pedidos y ticket promedio)
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: fechaDesde, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: fechaHasta, required: true, schema: { type: string, format: date-time } }
 *     responses:
 *       200:
 *         description: Resumen de ventas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ResumenDashboardDto' }
 */
export const dashboardRouter = Router();

const admin = [authenticate, authorize('Administrador')];

dashboardRouter.get(
  '/ventas',
  ...admin,
  validate({ query: ventasPorPeriodoQuerySchema }),
  dashboardController.ventasPorPeriodo,
);
dashboardRouter.get(
  '/productos',
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
