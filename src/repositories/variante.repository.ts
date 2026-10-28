import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface AtributoDto {
  nombre: string;
  valor: string;
}

export interface VarianteDto {
  id: number;
  idProducto: number;
  sku: string;
  precio: number;
  existencia: number;
  activo: boolean;
  atributos: AtributoDto[];
}

interface VarianteDbRow {
  IDVariante: number;
  IDProducto: number;
  SKU: string;
  Precio: number;
  Existencia: number;
  Activo: boolean;
  Atributos?: string;
}

const mapVariante = (r: VarianteDbRow): VarianteDto => ({
  id: r.IDVariante,
  idProducto: r.IDProducto,
  sku: r.SKU,
  precio: r.Precio,
  existencia: r.Existencia,
  activo: Boolean(r.Activo),
  atributos: r.Atributos ? (JSON.parse(r.Atributos) as AtributoDto[]) : [],
});

export async function listarVariantes(idProducto: number): Promise<VarianteDto[]> {
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_ListarVariantes', [
    { name: 'IDProducto', value: idProducto, type: sql.Int },
  ]);
  return rows.map(mapVariante);
}

export async function crearVariante(
  input: {
    idProducto: number;
    sku: string;
    precio: number;
    existencia: number;
    atributos?: { nombre: string; valor: string }[];
  },
  idUsuario: number,
): Promise<VarianteDto> {
  const atributosJson = input.atributos?.length ? JSON.stringify(input.atributos) : null;
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_CrearVariante', [
    { name: 'IDProducto', value: input.idProducto, type: sql.Int },
    { name: 'SKU', value: input.sku },
    { name: 'Precio', value: input.precio, type: sql.Decimal(10, 2) },
    { name: 'Existencia', value: input.existencia, type: sql.Int },
    { name: 'Atributos', value: atributosJson, type: sql.NVarChar(sql.MAX) },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapVariante(rows[0]);
}

export async function modificarVariante(
  id: number,
  input: { precio: number; existencia: number; activo: boolean },
  idUsuario: number,
): Promise<VarianteDto> {
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_ModificarVariante', [
    { name: 'IDVariante', value: id, type: sql.Int },
    { name: 'Precio', value: input.precio, type: sql.Decimal(10, 2) },
    { name: 'Existencia', value: input.existencia, type: sql.Int },
    { name: 'Activo', value: input.activo, type: sql.Bit },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapVariante(rows[0]);
}

export async function desactivarVariante(id: number, idUsuario: number): Promise<void> {
  await executeProcedure('SP_Catalogo_DesactivarVariante', [
    { name: 'IDVariante', value: id, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
