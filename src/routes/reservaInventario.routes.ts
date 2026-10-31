import { Router } from 'express';
import * as reservaInventarioController from '../controllers/reservaInventario.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { reservarSchema } from '../schemas/reservaInventario.schema.js';

/**
 * @swagger
 * /reservas:
 *   post:
 *     summary: Reserva la existencia de un carrito (inicio de pago)
 *     tags: [Reservas]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReservaRequest' }
 *     responses:
 *       201:
 *         description: Reservas creadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ReservaDto' }
 *       400: { description: Existencia insuficiente }
 * /reservas/vencidas:
 *   post:
 *     summary: Libera las reservas vencidas
 *     tags: [Reservas]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Reservas vencidas liberadas }
 */
export const reservaInventarioRouter = Router();

reservaInventarioRouter.post(
  '/',
  authenticate,
  validate({ body: reservarSchema }),
  reservaInventarioController.reservar,
);
reservaInventarioRouter.post(
  '/vencidas',
  authenticate,
  authorize('Administrador'),
  reservaInventarioController.liberarVencidas,
);
