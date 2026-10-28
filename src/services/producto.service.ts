import * as productoRepository from '../repositories/producto.repository.js';
import * as varianteRepository from '../repositories/variante.repository.js';
import type { ListarProductosFiltros, ProductoDto } from '../repositories/producto.repository.js';
import type { VarianteDto } from '../repositories/variante.repository.js';
import type { ListarProductosQuery } from '../schemas/producto.schema.js';
import { NotFoundError } from '../lib/errors.js';

export function listarProductos(query: ListarProductosQuery): Promise<ProductoDto[]> {
  const filtros: ListarProductosFiltros = {
    busqueda: query.busqueda,
    categoria: query.categoria,
    precioMin: query.precioMin,
    precioMax: query.precioMax,
    soloDisponibles: query.soloDisponibles
      ? ['true', '1'].includes(query.soloDisponibles)
      : false,
    ordenarPor: query.ordenarPor,
    direccion: query.direccion,
    pagina: query.pagina,
    tamanoPagina: query.tamanoPagina,
  };
  return productoRepository.listarProductos(filtros);
}

export async function consultarProductoConVariantes(
  id: number,
): Promise<ProductoDto & { variantes: VarianteDto[] }> {
  const producto = await productoRepository.consultarProducto(id);
  if (!producto) {
    throw new NotFoundError('Producto no encontrado.');
  }
  const variantes = await varianteRepository.listarVariantes(id);
  return { ...producto, variantes };
}

export const crearProducto = productoRepository.crearProducto;
export const modificarProducto = productoRepository.modificarProducto;
export const desactivarProducto = productoRepository.desactivarProducto;
