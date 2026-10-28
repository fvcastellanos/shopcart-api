import * as reservaInventarioRepository from '../repositories/reservaInventario.repository.js';
import type { ReservaDto } from '../repositories/reservaInventario.repository.js';

export function reservarExistencia(
  idCarrito: number,
  duracionMinutos = 15,
): Promise<ReservaDto[]> {
  return reservaInventarioRepository.reservarExistencia(idCarrito, duracionMinutos);
}

export const liberarReservasVencidas = reservaInventarioRepository.liberarReservasVencidas;
