import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { categoriaRouter } from './categoria.routes.js';
import { productoRouter } from './producto.routes.js';
import { varianteRouter } from './variante.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categorias', categoriaRouter);
apiRouter.use('/productos', productoRouter);
apiRouter.use('/variantes', varianteRouter);
