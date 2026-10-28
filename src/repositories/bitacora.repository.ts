import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface BitacoraDto {
  id: number;
  idUsuario: number;
  usuario: string;
  entidad: string;
  accion: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  fecha: Date;
  totalRegistros?: number;
}

export interface ListarBitacoraFiltros {
  entidad?: string;
  idUsuario?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  pagina?: number;
  tamanoPagina?: number;
}

interface BitacoraDbRow {
  IDBitacora: number;
  IDUsuario: number;
  Usuario: string;
  Entidad: string;
  Accion: string;
  ValorAnterior: string | null;
  ValorNuevo: string | null;
  Fecha: Date;
  TotalRegistros?: number;
}

const mapBitacora = (r: BitacoraDbRow): BitacoraDto => ({
  id: r.IDBitacora,
  idUsuario: r.IDUsuario,
  usuario: r.Usuario,
  entidad: r.Entidad,
  accion: r.Accion,
  valorAnterior: r.ValorAnterior ?? null,
  valorNuevo: r.ValorNuevo ?? null,
  fecha: r.Fecha,
  totalRegistros: r.TotalRegistros,
});

export async function listar(f: ListarBitacoraFiltros = {}): Promise<BitacoraDto[]> {
  const rows = await executeProcedure<BitacoraDbRow[]>('SP_Bitacora_Listar', [
    { name: 'Entidad', value: f.entidad ?? null, type: sql.NVarChar(100) },
    { name: 'IDUsuario', value: f.idUsuario ?? null, type: sql.Int },
    { name: 'FechaDesde', value: f.fechaDesde ?? null, type: sql.DateTime2 },
    { name: 'FechaHasta', value: f.fechaHasta ?? null, type: sql.DateTime2 },
    { name: 'Pagina', value: f.pagina ?? 1, type: sql.Int },
    { name: 'TamanoPagina', value: f.tamanoPagina ?? 20, type: sql.Int },
  ]);
  return rows.map(mapBitacora);
}
