import { Router } from 'express';
import * as reservaInventarioController from '../controllers/reservaInventario.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { reservarSchema } from '../schemas/reservaInventario.schema.js';

export const reservaInventarioRouter = Router();

reservaInventarioRouter.post(
  '/',
  authenticate,
  validate({ body: reservarSchema }),
  reservaInventarioController.reservar,
);
reservaInventarioRouter.post(
  '/liberar-vencidas',
  authenticate,
  authorize('Administrador'),
  reservaInventarioController.liberarVencidas,
);
