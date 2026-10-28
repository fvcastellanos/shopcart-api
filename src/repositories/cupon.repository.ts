import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface CuponDto {
  id: number;
  codigo: string;
  tipo: string;
  valor: number;
  montoMinimo: number;
  fechaInicio: Date;
  fechaFin: Date;
  limiteTotalUsos: number | null;
  limiteUsoPorCliente: number | null;
  totalUsos: number;
  idCategoria: number | null;
  categoria: string | null;
  activo: boolean;
  totalRegistros?: number;
}

export interface CrearCuponInput {
  codigo: string;
  tipo: string;
  valor: number;
  montoMinimo: number;
  fechaInicio: Date;
  fechaFin: Date;
  limiteTotalUsos?: number | null;
  limiteUsoPorCliente?: number | null;
  idCategoria?: number | null;
}

interface CuponDbRow {
  IDCupon: number;
  Codigo: string;
  Tipo: string;
  Valor: number;
  MontoMinimo: number;
  FechaInicio: Date;
  FechaFin: Date;
  LimiteTotalUsos: number | null;
  LimiteUsoPorCliente: number | null;
  TotalUsos: number;
  IDCategoria: number | null;
  Categoria: string | null;
  Activo: boolean;
  TotalRegistros?: number;
}

const mapCupon = (r: CuponDbRow): CuponDto => ({
  id: r.IDCupon,
  codigo: r.Codigo,
  tipo: r.Tipo,
  valor: r.Valor,
  montoMinimo: r.MontoMinimo,
  fechaInicio: r.FechaInicio,
  fechaFin: r.FechaFin,
  limiteTotalUsos: r.LimiteTotalUsos ?? null,
  limiteUsoPorCliente: r.LimiteUsoPorCliente ?? null,
  totalUsos: r.TotalUsos,
  idCategoria: r.IDCategoria ?? null,
  categoria: r.Categoria ?? null,
  activo: Boolean(r.Activo),
  totalRegistros: r.TotalRegistros,
});

export async function listar(
  busqueda?: string,
  pagina = 1,
  tamanoPagina = 10,
): Promise<CuponDto[]> {
  const rows = await executeProcedure<CuponDbRow[]>('SP_Cupones_Listar', [
    { name: 'Busqueda', value: busqueda ?? null, type: sql.NVarChar(100) },
    { name: 'Pagina', value: pagina, type: sql.Int },
    { name: 'TamanoPagina', value: tamanoPagina, type: sql.Int },
  ]);
  return rows.map(mapCupon);
}

export async function consultarPorCodigo(codigo: string): Promise<CuponDto | null> {
  const rows = await executeProcedure<CuponDbRow[]>('SP_Cupones_ConsultarPorCodigo', [
    { name: 'Codigo', value: codigo, type: sql.NVarChar(50) },
  ]);
  return rows[0] ? mapCupon(rows[0]) : null;
}

export async function crear(input: CrearCuponInput, idUsuario: number): Promise<CuponDto> {
  const rows = await executeProcedure<CuponDbRow[]>('SP_Cupones_Crear', [
    { name: 'Codigo', value: input.codigo, type: sql.NVarChar(50) },
    { name: 'Tipo', value: input.tipo, type: sql.NVarChar(20) },
    { name: 'Valor', value: input.valor, type: sql.Decimal(10, 2) },
    { name: 'MontoMinimo', value: input.montoMinimo, type: sql.Decimal(10, 2) },
    { name: 'FechaInicio', value: input.fechaInicio, type: sql.DateTime2 },
    { name: 'FechaFin', value: input.fechaFin, type: sql.DateTime2 },
    { name: 'LimiteTotalUsos', value: input.limiteTotalUsos ?? null, type: sql.Int },
    { name: 'LimiteUsoPorCliente', value: input.limiteUsoPorCliente ?? null, type: sql.Int },
    { name: 'IDCategoria', value: input.idCategoria ?? null, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapCupon(rows[0]);
}

export async function modificar(
  id: number,
  input: CrearCuponInput,
  idUsuario: number,
): Promise<CuponDto> {
  const rows = await executeProcedure<CuponDbRow[]>('SP_Cupones_Modificar', [
    { name: 'IDCupon', value: id, type: sql.Int },
    { name: 'Tipo', value: input.tipo, type: sql.NVarChar(20) },
    { name: 'Valor', value: input.valor, type: sql.Decimal(10, 2) },
    { name: 'MontoMinimo', value: input.montoMinimo, type: sql.Decimal(10, 2) },
    { name: 'FechaInicio', value: input.fechaInicio, type: sql.DateTime2 },
    { name: 'FechaFin', value: input.fechaFin, type: sql.DateTime2 },
    { name: 'LimiteTotalUsos', value: input.limiteTotalUsos ?? null, type: sql.Int },
    { name: 'LimiteUsoPorCliente', value: input.limiteUsoPorCliente ?? null, type: sql.Int },
    { name: 'IDCategoria', value: input.idCategoria ?? null, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapCupon(rows[0]);
}

export async function desactivar(id: number, idUsuario: number): Promise<void> {
  await executeProcedure('SP_Cupones_Desactivar', [
    { name: 'IDCupon', value: id, type: sql.Int },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
