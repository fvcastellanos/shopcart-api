import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const ROL_ADMINISTRADOR = 'Administrador';

export const admin = [authenticate, authorize('Administrador')];