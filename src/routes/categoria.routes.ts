import { Router } from 'express';
import * as categoriaController from '../controllers/categoria.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearCategoriaSchema, listarCategoriasQuerySchema } from '../schemas/categoria.schema.js';

export const categoriaRouter = Router();

const admin = [authenticate, authorize('Administrador')];

// Público (tienda)
categoriaRouter.get(
  '/',
  validate({ query: listarCategoriasQuerySchema }),
  categoriaController.listarCategorias,
);

// Administrador
categoriaRouter.post(
  '/',
  ...admin,
  validate({ body: crearCategoriaSchema }),
  categoriaController.crearCategoria,
);
categoriaRouter.put(
  '/:id',
  ...admin,
  validate({ params: idParamSchema, body: crearCategoriaSchema }),
  categoriaController.modificarCategoria,
);
categoriaRouter.delete(
  '/:id',
  ...admin,
  validate({ params: idParamSchema }),
  categoriaController.desactivarCategoria,
);
