import * as dashboardRepository from '../repositories/dashboard.repository.js';
import type {
  ProductoVendidoDto,
  ResumenDashboardDto,
  VentasPeriodoDto,
} from '../repositories/dashboard.repository.js';

export function ventasPorPeriodo(
  fechaDesde: Date,
  fechaHasta: Date,
  agruparPor = 'Dia',
): Promise<VentasPeriodoDto[]> {
  return dashboardRepository.ventasPorPeriodo(fechaDesde, fechaHasta, agruparPor);
}

export function productosMasVendidos(
  fechaDesde: Date,
  fechaHasta: Date,
  top = 10,
): Promise<ProductoVendidoDto[]> {
  return dashboardRepository.productosMasVendidos(fechaDesde, fechaHasta, top);
}

export function resumen(fechaDesde: Date, fechaHasta: Date): Promise<ResumenDashboardDto> {
  return dashboardRepository.resumen(fechaDesde, fechaHasta);
}
