import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface DireccionDto {
  id: number;
  idUsuario: number;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  referencia: string | null;
  esPrincipal: boolean;
  activo: boolean;
}

export interface CrearDireccionInput {
  linea1: string;
  linea2?: string | null;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  referencia?: string | null;
  esPrincipal?: boolean;
}

interface DireccionDbRow {
  IDDireccion: number;
  IDUsuario: number;
  Linea1: string;
  Linea2: string | null;
  Ciudad: string;
  Departamento: string;
  CodigoPostal: string;
  Referencia: string | null;
  EsPrincipal: boolean;
  Activo: boolean;
}

const mapDireccion = (r: DireccionDbRow): DireccionDto => ({
  id: r.IDDireccion,
  idUsuario: r.IDUsuario,
  linea1: r.Linea1,
  linea2: r.Linea2 ?? null,
  ciudad: r.Ciudad,
  departamento: r.Departamento,
  codigoPostal: r.CodigoPostal,
  referencia: r.Referencia ?? null,
  esPrincipal: Boolean(r.EsPrincipal),
  activo: Boolean(r.Activo),
});

export async function listarPorUsuario(idUsuario: number): Promise<DireccionDto[]> {
  const rows = await executeProcedure<DireccionDbRow[]>('SP_Direccion_ListarPorUsuario', [
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return rows.map(mapDireccion);
}

export async function consultar(id: number): Promise<DireccionDto | null> {
  const rows = await executeProcedure<DireccionDbRow[]>('SP_Direccion_Consultar', [
    { name: 'IDDireccion', value: id, type: sql.Int },
  ]);
  return rows[0] ? mapDireccion(rows[0]) : null;
}

export async function crear(idUsuario: number, input: CrearDireccionInput): Promise<DireccionDto> {
  const rows = await executeProcedure<DireccionDbRow[]>('SP_Direccion_Crear', [
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
    { name: 'Linea1', value: input.linea1, type: sql.NVarChar(200) },
    { name: 'Linea2', value: input.linea2 ?? null, type: sql.NVarChar(200) },
    { name: 'Ciudad', value: input.ciudad, type: sql.NVarChar(100) },
    { name: 'Departamento', value: input.departamento, type: sql.NVarChar(100) },
    { name: 'CodigoPostal', value: input.codigoPostal, type: sql.NVarChar(20) },
    { name: 'Referencia', value: input.referencia ?? null, type: sql.NVarChar(255) },
    { name: 'EsPrincipal', value: input.esPrincipal ?? false, type: sql.Bit },
  ]);
  return mapDireccion(rows[0]);
}

export async function modificar(id: number, input: CrearDireccionInput): Promise<DireccionDto> {
  const rows = await executeProcedure<DireccionDbRow[]>('SP_Direccion_Modificar', [
    { name: 'IDDireccion', value: id, type: sql.Int },
    { name: 'Linea1', value: input.linea1, type: sql.NVarChar(200) },
    { name: 'Linea2', value: input.linea2 ?? null, type: sql.NVarChar(200) },
    { name: 'Ciudad', value: input.ciudad, type: sql.NVarChar(100) },
    { name: 'Departamento', value: input.departamento, type: sql.NVarChar(100) },
    { name: 'CodigoPostal', value: input.codigoPostal, type: sql.NVarChar(20) },
    { name: 'Referencia', value: input.referencia ?? null, type: sql.NVarChar(255) },
    { name: 'EsPrincipal', value: input.esPrincipal ?? false, type: sql.Bit },
  ]);
  return mapDireccion(rows[0]);
}

export async function desactivar(id: number): Promise<void> {
  await executeProcedure('SP_Direccion_Desactivar', [
    { name: 'IDDireccion', value: id, type: sql.Int },
  ]);
}
