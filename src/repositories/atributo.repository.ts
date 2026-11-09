import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface AtributoDto {
  id: number;
  nombre: string;
  activo: boolean;
}

interface AtributoDbRow {
  IDAtributo: number;
  Nombre: string;
  Activo: boolean;
}

const mapAtributo = (r: AtributoDbRow): AtributoDto => ({
  id: r.IDAtributo,
  nombre: r.Nombre,
  activo: Boolean(r.Activo),
});

export async function listarAtributos(soloActivas: boolean): Promise<AtributoDto[]> {
  const rows = await executeProcedure<AtributoDbRow[]>('SP_Atributos_Listar', [
    { name: 'SoloActivas', value: soloActivas, type: sql.Bit },
  ]);
  return rows.map(mapAtributo);
}

export async function crearAtributo(nombre: string, idUsuario: number): Promise<AtributoDto> {
  const rows = await executeProcedure<AtributoDbRow[]>('SP_Atributos_Crear', [
    { name: 'Nombre', value: nombre },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapAtributo(rows[0]);
}

export async function modificarAtributo(
  id: number,
  nombre: string,
  idUsuario: number,
): Promise<AtributoDto> {
  const rows = await executeProcedure<AtributoDbRow[]>('SP_Atributos_Modificar', [
    { name: 'IDAtributo', value: id, type: sql.Int },
    { name: 'Nombre', value: nombre },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapAtributo(rows[0]);
}

export async function desactivarAtributo(id: number, idUsuario: number): Promise<void> {
  await executeProcedure('SP_Atributos_Desactivar', [
    { name: 'IDAtributo', value: id, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
