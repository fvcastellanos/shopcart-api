import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface ProductoDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  idCategoria: number;
  categoria: string;
  precioDesde: number | null;
  precioHasta: number | null;
  existenciaTotal: number | null;
  activo: boolean;
  totalRegistros?: number;
}

export interface ListarProductosFiltros {
  busqueda?: string;
  categoria?: number;
  precioMin?: number;
  precioMax?: number;
  soloDisponibles?: boolean;
  ordenarPor?: string;
  direccion?: string;
  pagina?: number;
  tamanoPagina?: number;
}

interface ProductoDbRow {
  IDProducto: number;
  Nombre: string;
  Descripcion: string | null;
  IDCategoria: number;
  Categoria: string;
  PrecioDesde?: number | null;
  PrecioHasta?: number | null;
  ExistenciaTotal?: number | null;
  Activo: boolean;
  TotalRegistros?: number;
}

const mapProducto = (r: ProductoDbRow): ProductoDto => ({
  id: r.IDProducto,
  nombre: r.Nombre,
  descripcion: r.Descripcion ?? null,
  idCategoria: r.IDCategoria,
  categoria: r.Categoria,
  precioDesde: r.PrecioDesde ?? null,
  precioHasta: r.PrecioHasta ?? null,
  existenciaTotal: r.ExistenciaTotal ?? null,
  activo: Boolean(r.Activo),
  totalRegistros: r.TotalRegistros,
});

export async function listarProductos(f: ListarProductosFiltros = {}): Promise<ProductoDto[]> {
  const rows = await executeProcedure<ProductoDbRow[]>('SP_Catalogo_ListarProductos', [
    { name: 'Busqueda', value: f.busqueda ?? null, type: sql.NVarChar(200) },
    { name: 'IDCategoria', value: f.categoria ?? null, type: sql.Int },
    { name: 'PrecioMin', value: f.precioMin ?? null, type: sql.Decimal(10, 2) },
    { name: 'PrecioMax', value: f.precioMax ?? null, type: sql.Decimal(10, 2) },
    { name: 'SoloDisponibles', value: f.soloDisponibles ?? false, type: sql.Bit },
    { name: 'OrdenarPor', value: f.ordenarPor ?? 'Nombre', type: sql.NVarChar(30) },
    { name: 'Direccion', value: f.direccion ?? 'ASC', type: sql.NVarChar(4) },
    { name: 'Pagina', value: f.pagina ?? 1, type: sql.Int },
    { name: 'TamanoPagina', value: f.tamanoPagina ?? 10, type: sql.Int },
  ]);
  return rows.map(mapProducto);
}

export async function consultarProducto(id: number): Promise<ProductoDto | null> {
  const rows = await executeProcedure<ProductoDbRow[]>('SP_Catalogo_ConsultarProducto', [
    { name: 'IDProducto', value: id, type: sql.Int },
  ]);
  return rows[0] ? mapProducto(rows[0]) : null;
}

export async function crearProducto(
  input: { nombre: string; descripcion?: string; idCategoria: number },
  idUsuario: number,
): Promise<ProductoDto> {
  const rows = await executeProcedure<ProductoDbRow[]>('SP_Catalogo_CrearProducto', [
    { name: 'Nombre', value: input.nombre },
    { name: 'Descripcion', value: input.descripcion ?? null, type: sql.NVarChar(sql.MAX) },
    { name: 'IDCategoria', value: input.idCategoria, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapProducto(rows[0]);
}

export async function modificarProducto(
  id: number,
  input: { nombre: string; descripcion?: string; idCategoria: number },
  idUsuario: number,
): Promise<ProductoDto> {
  const rows = await executeProcedure<ProductoDbRow[]>('SP_Catalogo_ModificarProducto', [
    { name: 'IDProducto', value: id, type: sql.Int },
    { name: 'Nombre', value: input.nombre },
    { name: 'Descripcion', value: input.descripcion ?? null, type: sql.NVarChar(sql.MAX) },
    { name: 'IDCategoria', value: input.idCategoria, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapProducto(rows[0]);
}

export async function desactivarProducto(id: number, idUsuario: number): Promise<void> {
  await executeProcedure('SP_Catalogo_DesactivarProducto', [
    { name: 'IDProducto', value: id, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
