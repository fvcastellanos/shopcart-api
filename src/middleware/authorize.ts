import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../lib/errors.js';
import type { Role } from '../types/auth.js';

/**
 * Restringe el acceso por rol (RF-01). Debe usarse después de `authenticate`.
 * Ejemplo: authorize('Administrador'), authorize('Operador', 'Administrador').
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      next(new ForbiddenError());
      return;
    }
    if (!roles.includes(user.rol)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
