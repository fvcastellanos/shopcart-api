import sql from 'mssql';
import { executeProcedure } from './sp.js';

export interface VentasPeriodoDto {
  periodo: string;
  ventas: number;
  pedidos: number;
}

export interface ProductoVendidoDto {
  idProducto: number;
  producto: string;
  unidadesVendidas: number;
  totalVendido: number;
}

export interface ResumenDashboardDto {
  totalVentas: number;
  totalPedidos: number;
  ticketPromedio: number;
}

interface VentasPeriodoDbRow {
  Periodo: string | Date;
  Ventas: number;
  Pedidos: number;
}

interface ProductoVendidoDbRow {
  IDProducto: number;
  Producto: string;
  UnidadesVendidas: number;
  TotalVendido: number;
}

interface ResumenDbRow {
  TotalVentas: number;
  TotalPedidos: number;
  TicketPromedio: number;
}

export async function ventasPorPeriodo(
  fechaDesde: Date,
  fechaHasta: Date,
  agruparPor = 'Dia',
): Promise<VentasPeriodoDto[]> {
  const rows = await executeProcedure<VentasPeriodoDbRow[]>('SP_Dashboard_VentasPorPeriodo', [
    { name: 'FechaDesde', value: fechaDesde, type: sql.DateTime2 },
    { name: 'FechaHasta', value: fechaHasta, type: sql.DateTime2 },
    { name: 'AgruparPor', value: agruparPor, type: sql.NVarChar(10) },
  ]);
  return rows.map((r) => ({
    periodo: r.Periodo instanceof Date ? r.Periodo.toISOString().slice(0, 10) : String(r.Periodo),
    ventas: r.Ventas,
    pedidos: r.Pedidos,
  }));
}

export async function productosMasVendidos(
  fechaDesde: Date,
  fechaHasta: Date,
  top = 10,
): Promise<ProductoVendidoDto[]> {
  const rows = await executeProcedure<ProductoVendidoDbRow[]>('SP_Dashboard_ProductosMasVendidos', [
    { name: 'FechaDesde', value: fechaDesde, type: sql.DateTime2 },
    { name: 'FechaHasta', value: fechaHasta, type: sql.DateTime2 },
    { name: 'Top', value: top, type: sql.Int },
  ]);
  return rows.map((r) => ({
    idProducto: r.IDProducto,
    producto: r.Producto,
    unidadesVendidas: r.UnidadesVendidas,
    totalVendido: r.TotalVendido,
  }));
}

export async function resumen(fechaDesde: Date, fechaHasta: Date): Promise<ResumenDashboardDto> {
  const rows = await executeProcedure<ResumenDbRow[]>('SP_Dashboard_Resumen', [
    { name: 'FechaDesde', value: fechaDesde, type: sql.DateTime2 },
    { name: 'FechaHasta', value: fechaHasta, type: sql.DateTime2 },
  ]);
  const r = rows[0];
  return {
    totalVentas: r.TotalVentas,
    totalPedidos: r.TotalPedidos,
    ticketPromedio: r.TicketPromedio,
  };
}
