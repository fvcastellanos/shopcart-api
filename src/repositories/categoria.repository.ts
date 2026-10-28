import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface CategoriaDto {
  id: number;
  nombre: string;
  activo: boolean;
}

interface CategoriaDbRow {
  IDCategoria: number;
  Nombre: string;
  Activo: boolean;
}

const mapCategoria = (r: CategoriaDbRow): CategoriaDto => ({
  id: r.IDCategoria,
  nombre: r.Nombre,
  activo: Boolean(r.Activo),
});

export async function listarCategorias(soloActivas: boolean): Promise<CategoriaDto[]> {
  const rows = await executeProcedure<CategoriaDbRow[]>('SP_Catalogo_ListarCategorias', [
    { name: 'SoloActivas', value: soloActivas, type: sql.Bit },
  ]);
  return rows.map(mapCategoria);
}

export async function crearCategoria(nombre: string, idUsuario: number): Promise<CategoriaDto> {
  const rows = await executeProcedure<CategoriaDbRow[]>('SP_Catalogo_CrearCategoria', [
    { name: 'Nombre', value: nombre },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapCategoria(rows[0]);
}

export async function modificarCategoria(
  id: number,
  nombre: string,
  idUsuario: number,
): Promise<CategoriaDto> {
  const rows = await executeProcedure<CategoriaDbRow[]>('SP_Catalogo_ModificarCategoria', [
    { name: 'IDCategoria', value: id, type: sql.Int },
    { name: 'Nombre', value: nombre },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapCategoria(rows[0]);
}

export async function desactivarCategoria(id: number, idUsuario: number): Promise<void> {
  await executeProcedure('SP_Catalogo_DesactivarCategoria', [
    { name: 'IDCategoria', value: id, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
