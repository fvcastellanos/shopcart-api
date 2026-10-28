import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface ValidateTargets {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * En Express 5 `req.query` y `req.params` son getters de solo lectura, por lo
 * que se sobrescriben mediante `Object.defineProperty` (own property que
 * sombrea al getter del prototipo) con el resultado ya validado/coercionado.
 */
function setParsed(req: Request, key: 'query' | 'params', value: unknown): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

/**
 * Valida body, query y/o params contra esquemas Zod. Los datos validados
 * reemplazan a los originales en `req`.
 */
export function validate(targets: ValidateTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (targets.body) req.body = targets.body.parse(req.body);
      if (targets.query) setParsed(req, 'query', targets.query.parse(req.query));
      if (targets.params) setParsed(req, 'params', targets.params.parse(req.params));
      next();
    } catch (err) {
      next(err);
    }
  };
}
