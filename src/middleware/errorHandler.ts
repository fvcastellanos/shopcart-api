import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

// Mapea errores de SQL Server (THROW con número de error) a códigos HTTP.
const SQL_ERROR_HTTP: Record<number, number> = {
  50001: 409, // correo ya registrado
  50002: 404, // usuario no encontrado
  50011: 409, // categoría duplicada
  50012: 409, // SKU duplicado
  50013: 404, // producto no encontrado
  50014: 404, // categoría no encontrada
  50015: 404, // variante no encontrada
  50016: 404, // producto no encontrado
};

function isSqlRequestError(err: unknown): err is { number: number; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'number' in err &&
    typeof (err as { number: unknown }).number === 'number'
  );
}

function httpCodeFromStatus(status: number): string {
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  return 'BUSINESS_ERROR';
}

/**
 * Manejo centralizado de errores: produce respuestas JSON consistentes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Errores de reglas de negocio lanzados por los Stored Procedures (THROW).
  if (isSqlRequestError(err)) {
    const status = SQL_ERROR_HTTP[err.number];
    if (status) {
      res.status(status).json({
        error: { code: httpCodeFromStatus(status), message: err.message },
      });
      return;
    }
  }

  logger.error(err);
  const isProd = env.NODE_ENV === 'production';
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Error interno del servidor.' : err instanceof Error ? err.message : 'Error desconocido.',
    },
  });
}
