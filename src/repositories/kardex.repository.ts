import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface ExistenciaDto {
  idVariante: number;
  sku: string;
  existenciaFisica: number;
  existenciaReservada: number;
  existenciaDisponible: number;
}

export interface KardexDto {
  id: number;
  idVariante: number;
  tipoMovimiento: string;
  cantidad: number;
  existenciaNueva: number;
  motivo: string | null;
  idUsuario: number;
  usuario: string;
  fechaRegistro: Date;
  totalRegistros?: number;
}

interface ExistenciaDbRow {
  IDVariante: number;
  SKU: string;
  ExistenciaFisica: number;
  ExistenciaReservada: number;
  ExistenciaDisponible: number;
}

interface KardexDbRow {
  IDKardex: number;
  IDVariante: number;
  TipoMovimiento: string;
  Cantidad: number;
  ExistenciaNueva: number;
  Motivo: string | null;
  IDUsuario: number;
  Usuario: string;
  FechaRegistro: Date;
  TotalRegistros?: number;
}

const mapKardex = (r: KardexDbRow): KardexDto => ({
  id: r.IDKardex,
  idVariante: r.IDVariante,
  tipoMovimiento: r.TipoMovimiento,
  cantidad: r.Cantidad,
  existenciaNueva: r.ExistenciaNueva,
  motivo: r.Motivo ?? null,
  idUsuario: r.IDUsuario,
  usuario: r.Usuario,
  fechaRegistro: r.FechaRegistro,
  totalRegistros: r.TotalRegistros,
});

export async function consultarExistencia(idVariante: number): Promise<ExistenciaDto | null> {
  const rows = await executeProcedure<ExistenciaDbRow[]>('SP_Inventario_ConsultarExistencia', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
  ]);
  const r = rows[0];
  return r
    ? {
        idVariante: r.IDVariante,
        sku: r.SKU,
        existenciaFisica: r.ExistenciaFisica,
        existenciaReservada: r.ExistenciaReservada,
        existenciaDisponible: r.ExistenciaDisponible,
      }
    : null;
}

export async function registrarEntrada(
  idVariante: number,
  cantidad: number,
  motivo: string | null,
  idUsuario: number,
): Promise<number> {
  const rows = await executeProcedure<{ ExistenciaNueva: number }[]>('SP_Inventario_RegistrarEntrada', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'Cantidad', value: cantidad, type: sql.Int },
    { name: 'Motivo', value: motivo ?? null, type: sql.NVarChar(255) },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return rows[0].ExistenciaNueva;
}

export async function registrarAjuste(
  idVariante: number,
  cantidad: number,
  motivo: string,
  idUsuario: number,
): Promise<number> {
  const rows = await executeProcedure<{ ExistenciaNueva: number }[]>('SP_Inventario_RegistrarAjuste', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'Cantidad', value: cantidad, type: sql.Int },
    { name: 'Motivo', value: motivo, type: sql.NVarChar(255) },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return rows[0].ExistenciaNueva;
}

export async function listarKardex(
  idVariante: number,
  pagina = 1,
  tamanoPagina = 20,
): Promise<KardexDto[]> {
  const rows = await executeProcedure<KardexDbRow[]>('SP_Inventario_ListarKardex', [
    { name: 'IDVariante', value: idVariante, type: sql.Int },
    { name: 'Pagina', value: pagina, type: sql.Int },
    { name: 'TamanoPagina', value: tamanoPagina, type: sql.Int },
  ]);
  return rows.map(mapKardex);
}
