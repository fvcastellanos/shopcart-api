import * as atributoRepository from '../repositories/atributo.repository.js';
import type { AtributoDto } from '../repositories/atributo.repository.js';

export function listarAtributos(soloActivas: boolean): Promise<AtributoDto[]> {
  return atributoRepository.listarAtributos(soloActivas);
}

export const crearAtributo = atributoRepository.crearAtributo;
export const modificarAtributo = atributoRepository.modificarAtributo;
export const desactivarAtributo = atributoRepository.desactivarAtributo;
