import type { NextFunction, Request, Response } from 'express';
import { passport } from '../auth/passport.js';
import { UnauthorizedError } from '../lib/errors.js';

/**
 * Middleware de autenticación con JWT (Passport). Un token inválido/vencido
 * devuelve 401 vía el manejador centralizado de errores.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) {
      next(err);
      return;
    }
    if (!user) {
      next(new UnauthorizedError());
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}

/**
 * Autenticación opcional: establece `req.user` si hay un token válido, pero
 * continúa sin error si no lo hay. Útil para recursos accesibles a invitados
 * (p. ej. carrito de invitado) y autenticados.
 */
export function authenticateOptional(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) {
      next(err);
      return;
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
}
