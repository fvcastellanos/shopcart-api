import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface CarritoDto {
  id: number;
  idUsuario: number | null;
  token: string | null;
  fechaCreacion: Date;
  fechaUltimaActividad: Date;
}

export interface CarritoItemDto {
  id: number;
  idCarrito: number;
  idVariante: number;
  cantidad: number;
  sku: string;
  precio: number;
  idProducto: number;
  producto: string;
  subtotalLinea: number;
  subtotal: number;
  reservado: number;
}

interface CarritoDbRow {
  IDCarrito: number;
  IDUsuario: number | null;
  Token: string | null;
  FechaCreacion: Date;
  FechaUltimaActividad: Date;
}

interface CarritoItemDbRow {
  IDDetalleCarrito: number;
  IDCarrito: number;
  IDVariante: number;
  Cantidad: number;
  SKU: string;
  Precio: number;
  IDProducto: number;
  Producto: string;
  SubtotalLinea: number;
  Subtotal: number;
  Reservado: number;
}

const mapCarrito = (r: CarritoDbRow): CarritoDto => ({
  id: r.IDCarrito,
  idUsuario: r.IDUsuario ?? null,
  token: r.Token ?? null,
  fechaCreacion: r.FechaCreacion,
  fechaUltimaActividad: r.FechaUltimaActividad,
});

const mapCarritoItem = (r: CarritoItemDbRow): CarritoItemDto => ({
  id: r.IDDetalleCarrito,
  idCarrito: r.IDCarrito,
  idVariante: r.IDVariante,
  cantidad: r.Cantidad,
  sku: r.SKU,
  precio: r.Precio,
  idProducto: r.IDProducto,
  producto: r.Producto,
  subtotalLinea: r.SubtotalLinea,
  subtotal: r.Subtotal,
  reservado: r.Reservado,
});

export async function crear(idUsuario: number | null, token: string | null): Promise<CarritoDto> {
  const rows = await executeProcedure<CarritoDbRow[]>('SP_Carrito_Crear', [
    { name: 'IDUsuario', value: idUsuario ?? null, type: sql.Int },
    { name: 'Token', value: token ?? null, type: sql.NVarChar(64) },
  ]);
  return mapCarrito(rows[0]);
}

export async function obtenerPorUsuario(idUsuario: number): Promise<CarritoDto | null> {
  const rows = await executeProcedure<CarritoDbRow[]>('SP_Carrito_ObtenerPorUsuario', [
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return rows[0] ? mapCarrito(rows[0]) : null;
}

export async function obtenerPorToken(token: string): Promise<CarritoDto | null> {
  const rows = await executeProcedure<CarritoDbRow[]>('SP_Carrito_ObtenerPorToken', [
    { name: 'Token', value: token, type: sql.NVarChar(64) },
  ]);
  return rows[0] ? mapCarrito(rows[0]) : null;
}

export async function obtenerItems(idCarrito: number): Promise<CarritoItemDto[]> {
  const rows = await executeProcedure<CarritoItemDbRow[]>('SP_Carrito_ObtenerItems', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
  ]);
  return rows.map(mapCarritoItem);
}

export async function agregarItem(
  idCarrito: number,
  idVariante: number,
  cantidad: number,
): Promise<void> {
  await executeProcedure('SP_Carrito_AgregarItem', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'Cantidad', value: cantidad, type: sql.Int },
  ]);
}

export async function actualizarItem(
  idCarrito: number,
  idVariante: number,
  cantidad: number,
): Promise<void> {
  await executeProcedure('SP_Carrito_ActualizarItem', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'Cantidad', value: cantidad, type: sql.Int },
  ]);
}

export async function eliminarItem(idCarrito: number, idVariante: number): Promise<void> {
  await executeProcedure('SP_Carrito_EliminarItem', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
    { name: 'IDVariante', value: idVariante, type: sql.Int },
  ]);
}

export async function limpiar(idCarrito: number): Promise<void> {
  await executeProcedure('SP_Carrito_Limpiar', [{ name: 'IDCarrito', value: idCarrito, type: sql.Int }]);
}
