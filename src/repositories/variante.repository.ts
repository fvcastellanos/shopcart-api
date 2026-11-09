import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface VarianteAtributoDto {
  idAtributo: number;
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
  atributos: VarianteAtributoDto[];
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
  atributos: r.Atributos ? (JSON.parse(r.Atributos) as VarianteAtributoDto[]) : [],
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
  },
  idUsuario: number,
): Promise<VarianteDto> {
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_CrearVariante', [
    { name: 'IDProducto', value: input.idProducto, type: sql.Int },
    { name: 'SKU', value: input.sku },
    { name: 'Precio', value: input.precio, type: sql.Decimal(10, 2) },
    { name: 'Existencia', value: input.existencia, type: sql.Int },
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

export async function agregarAtributoVariante(
  idVariante: number,
  idAtributo: number,
  valor: string,
  idUsuario: number,
): Promise<VarianteDto> {
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_AgregarAtributoVariante', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'IDAtributo', value: idAtributo, type: sql.Int },
    { name: 'Valor', value: valor },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapVariante(rows[0]);
}

export async function modificarAtributoVariante(
  idVariante: number,
  idAtributo: number,
  valor: string,
  idUsuario: number,
): Promise<VarianteDto> {
  const rows = await executeProcedure<VarianteDbRow[]>('SP_Catalogo_ModificarAtributoVariante', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'IDAtributo', value: idAtributo, type: sql.Int },
    { name: 'Valor', value: valor },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapVariante(rows[0]);
}

export async function quitarAtributoVariante(
  idVariante: number,
  idAtributo: number,
  idUsuario: number,
): Promise<void> {
  await executeProcedure('SP_Catalogo_QuitarAtributoVariante', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'IDAtributo', value: idAtributo, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
