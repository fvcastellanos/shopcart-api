import * as direccionRepository from '../repositories/direccion.repository.js';
import type { CrearDireccionInput, DireccionDto } from '../repositories/direccion.repository.js';

export function listarPorUsuario(idUsuario: number): Promise<DireccionDto[]> {
  return direccionRepository.listarPorUsuario(idUsuario);
}

export function crear(idUsuario: number, input: CrearDireccionInput): Promise<DireccionDto> {
  return direccionRepository.crear(idUsuario, input);
}

export function modificar(id: number, input: CrearDireccionInput): Promise<DireccionDto> {
  return direccionRepository.modificar(id, input);
}

export const desactivar = direccionRepository.desactivar;
