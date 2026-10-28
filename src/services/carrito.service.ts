import * as carritoRepository from '../repositories/carrito.repository.js';
import type { CarritoDto, CarritoItemDto } from '../repositories/carrito.repository.js';

export function crear(idUsuario: number | null, token: string | null): Promise<CarritoDto> {
  return carritoRepository.crear(idUsuario, token);
}

export async function obtenerItems(
  idCarrito: number,
): Promise<{ items: CarritoItemDto[]; subtotal: number }> {
  const items = await carritoRepository.obtenerItems(idCarrito);
  const subtotal = items[0]?.subtotal ?? 0;
  return { items, subtotal };
}

export const agregarItem = carritoRepository.agregarItem;
export const actualizarItem = carritoRepository.actualizarItem;
export const eliminarItem = carritoRepository.eliminarItem;
export const limpiar = carritoRepository.limpiar;
