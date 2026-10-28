import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface ReservaDto {
  id: number;
  idVariante: number;
  cantidad: number;
  estado: string;
  fechaExpiracion: Date;
}

interface ReservaDbRow {
  IDReservaInventario: number;
  IDVariante: number;
  Cantidad: number;
  Estado: string;
  FechaExpiracion: Date;
}

const mapReserva = (r: ReservaDbRow): ReservaDto => ({
  id: r.IDReservaInventario,
  idVariante: r.IDVariante,
  cantidad: r.Cantidad,
  estado: r.Estado,
  fechaExpiracion: r.FechaExpiracion,
});

export async function reservarExistencia(
  idCarrito: number,
  duracionMinutos = 15,
): Promise<ReservaDto[]> {
  const rows = await executeProcedure<ReservaDbRow[]>('SP_Inventario_ReservarExistencia', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
    { name: 'DuracionMinutos', value: duracionMinutos, type: sql.Int },
  ]);
  return rows.map(mapReserva);
}

export async function liberarReservasVencidas(): Promise<void> {
  await executeProcedure('SP_Inventario_LiberarReservasVencidas');
}
