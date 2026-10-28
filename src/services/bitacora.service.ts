import * as bitacoraRepository from '../repositories/bitacora.repository.js';
import type { BitacoraDto, ListarBitacoraFiltros } from '../repositories/bitacora.repository.js';

export function listar(filtros: ListarBitacoraFiltros = {}): Promise<BitacoraDto[]> {
  return bitacoraRepository.listar(filtros);
}
