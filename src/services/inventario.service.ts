import * as kardexRepository from '../repositories/kardex.repository.js';
import type { ExistenciaDto, KardexDto } from '../repositories/kardex.repository.js';

export function consultarExistencia(idVariante: number): Promise<ExistenciaDto | null> {
  return kardexRepository.consultarExistencia(idVariante);
}

export function listarKardex(
  idVariante: number,
  pagina = 1,
  tamanoPagina = 20,
): Promise<KardexDto[]> {
  return kardexRepository.listarKardex(idVariante, pagina, tamanoPagina);
}

export function registrarEntrada(
  idVariante: number,
  cantidad: number,
  motivo: string | null,
  idUsuario: number,
): Promise<number> {
  return kardexRepository.registrarEntrada(idVariante, cantidad, motivo, idUsuario);
}

export function registrarAjuste(
  idVariante: number,
  cantidad: number,
  motivo: string,
  idUsuario: number,
): Promise<number> {
  return kardexRepository.registrarAjuste(idVariante, cantidad, motivo, idUsuario);
}
