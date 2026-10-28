import * as cuponRepository from '../repositories/cupon.repository.js';
import type { CrearCuponInput, CuponDto } from '../repositories/cupon.repository.js';

export function listar(busqueda?: string, pagina = 1, tamanoPagina = 10): Promise<CuponDto[]> {
  return cuponRepository.listar(busqueda, pagina, tamanoPagina);
}

export const consultarPorCodigo = cuponRepository.consultarPorCodigo;

export function crear(input: CrearCuponInput, idUsuario: number): Promise<CuponDto> {
  return cuponRepository.crear(input, idUsuario);
}

export function modificar(id: number, input: CrearCuponInput, idUsuario: number): Promise<CuponDto> {
  return cuponRepository.modificar(id, input, idUsuario);
}

export const desactivar = cuponRepository.desactivar;
