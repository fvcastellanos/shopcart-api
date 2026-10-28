import type { AuthUser } from './auth.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Augmenta el tipo `req.user` con los datos del usuario autenticado.
    interface User extends AuthUser {}
  }
}

export {};
