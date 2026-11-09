import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

// Mapea errores de SQL Server (THROW con número de error) a códigos HTTP.
const SQL_ERROR_HTTP: Record<number, number> = {
  // No encontrado → 404
  50002: 404, // usuario no encontrado
  50013: 404, // producto no encontrado
  50014: 404, // categoría no encontrada
  50015: 404, // variante no encontrada
  50016: 404, // producto no encontrado
  50017: 404, // atributo no encontrado
  50023: 404, // atributo no asociado a la variante
  50034: 404, // producto no está en el carrito
  50040: 404, // carrito no encontrado
  50052: 404, // cupón no encontrado
  50053: 404, // cupón no encontrado
  50061: 404, // dirección no encontrada
  50070: 404, // pedido no encontrado
  50073: 404, // línea de pedido no encontrada
  // Regla de negocio / conflicto → 422
  50001: 422, // correo ya registrado
  50011: 422, // categoría duplicada
  50012: 422, // SKU duplicado
  50018: 422, // atributo duplicado
  50019: 422, // atributo ya asociado a la variante
  50020: 422, // cantidad debe ser mayor que cero
  50021: 422, // el ajuste exige un motivo
  50022: 422, // el ajuste no puede dejar existencia negativa
  50030: 422, // debe indicar usuario o token
  50031: 422, // cantidad debe ser mayor que cero
  50032: 422, // variante no disponible
  50033: 422, // existencia insuficiente
  50041: 422, // dirección no válida
  50042: 422, // carrito vacío
  50043: 422, // existencia insuficiente
  50050: 422, // cupón con código duplicado
  50051: 422, // la fecha fin debe ser posterior a la fecha inicio
  50054: 422, // cupón inactivo
  50055: 422, // cupón aún no vigente
  50056: 422, // cupón vencido
  50057: 422, // no cumple el monto mínimo
  50058: 422, // cupón agotado
  50059: 422, // límite de usos alcanzado
  50060: 422, // existencia insuficiente para reservar
  50071: 422, // transición de estado no permitida
  50072: 422, // solo se puede devolver un pedido entregado
  50074: 422, // no se puede devolver más de lo vendido
  50003: 422, // rol 'Cliente' no existe
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
  if (status === 422) return 'UNPROCESSABLE_ENTITY';
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
