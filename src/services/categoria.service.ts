import * as categoriaRepository from '../repositories/categoria.repository.js';
import type { CategoriaDto } from '../repositories/categoria.repository.js';

export function listarCategorias(soloActivas: boolean): Promise<CategoriaDto[]> {
  return categoriaRepository.listarCategorias(soloActivas);
}

export const crearCategoria = categoriaRepository.crearCategoria;
export const modificarCategoria = categoriaRepository.modificarCategoria;
export const desactivarCategoria = categoriaRepository.desactivarCategoria;
