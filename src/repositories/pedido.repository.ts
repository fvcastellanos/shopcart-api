import sql from 'mssql';
import { executeProcedure, executeProcedureSets } from './sp.js';

export interface PedidoDto {
  id: number;
  idUsuario?: number;
  correo?: string;
  idDireccion?: number;
  idCupon?: number | null;
  codigoCupon?: string | null;
  estado: string;
  subtotal: number;
  descuento: number;
  total: number;
  numeroSeguimiento: string;
  fechaCreacion: Date;
  totalRegistros?: number;
}

export interface DetallePedidoDto {
  id: number;
  idVariante: number;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  cantidadDevuelta: number;
  sku: string;
  producto: string;
}

export interface HistorialEstadoDto {
  id: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  idUsuario: number;
  usuario: string;
  fecha: Date;
}

interface PedidoDbRow {
  IDPedido: number;
  IDUsuario?: number;
  Correo?: string;
  IDDireccion?: number;
  IDCupon?: number | null;
  CodigoCupon?: string | null;
  Estado: string;
  Subtotal: number;
  Descuento: number;
  Total: number;
  NumeroSeguimiento: string;
  FechaCreacion: Date;
  TotalRegistros?: number;
}

interface DetallePedidoDbRow {
  IDDetallePedido: number;
  IDVariante: number;
  Cantidad: number;
  PrecioUnitario: number;
  DescuentoLinea: number;
  CantidadDevuelta: number;
  SKU: string;
  Producto: string;
}

interface HistorialDbRow {
  IDHistorialEstadoPedido: number;
  EstadoAnterior: string | null;
  EstadoNuevo: string;
  IDUsuario: number;
  Usuario: string;
  Fecha: Date;
}

const mapPedido = (r: PedidoDbRow): PedidoDto => ({
  id: r.IDPedido,
  idUsuario: r.IDUsuario,
  correo: r.Correo,
  idDireccion: r.IDDireccion,
  idCupon: r.IDCupon ?? null,
  codigoCupon: r.CodigoCupon ?? null,
  estado: r.Estado,
  subtotal: r.Subtotal,
  descuento: r.Descuento,
  total: r.Total,
  numeroSeguimiento: r.NumeroSeguimiento,
  fechaCreacion: r.FechaCreacion,
  totalRegistros: r.TotalRegistros,
});

const mapDetalle = (r: DetallePedidoDbRow): DetallePedidoDto => ({
  id: r.IDDetallePedido,
  idVariante: r.IDVariante,
  cantidad: r.Cantidad,
  precioUnitario: r.PrecioUnitario,
  descuentoLinea: r.DescuentoLinea,
  cantidadDevuelta: r.CantidadDevuelta,
  sku: r.SKU,
  producto: r.Producto,
});

const mapHistorial = (r: HistorialDbRow): HistorialEstadoDto => ({
  id: r.IDHistorialEstadoPedido,
  estadoAnterior: r.EstadoAnterior ?? null,
  estadoNuevo: r.EstadoNuevo,
  idUsuario: r.IDUsuario,
  usuario: r.Usuario,
  fecha: r.Fecha,
});

export async function crearPedido(
  idCarrito: number,
  idDireccion: number,
  codigoCupon: string | null,
  claveIdempotencia: string,
  idUsuario: number,
): Promise<PedidoDto> {
  const rows = await executeProcedure<PedidoDbRow[]>('SP_Pedidos_CrearPedido', [
    { name: 'IDCarrito', value: idCarrito, type: sql.Int },
    { name: 'IDDireccion', value: idDireccion, type: sql.Int },
    { name: 'CodigoCupon', value: codigoCupon ?? null, type: sql.NVarChar(50) },
    { name: 'ClaveIdempotencia', value: claveIdempotencia, type: sql.NVarChar(64) },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
  return mapPedido(rows[0]);
}

export async function consultar(
  idPedido: number,
): Promise<{ pedido: PedidoDto | null; detalle: DetallePedidoDto[]; historial: HistorialEstadoDto[] }> {
  const sets = await executeProcedureSets('SP_Pedidos_Consultar', [
    { name: 'IDPedido', value: idPedido, type: sql.Int },
  ]);
  const pedido = (sets[0] as PedidoDbRow[])?.[0];
  const detalle = (sets[1] as DetallePedidoDbRow[]) ?? [];
  const historial = (sets[2] as HistorialDbRow[]) ?? [];
  return {
    pedido: pedido ? mapPedido(pedido) : null,
    detalle: detalle.map(mapDetalle),
    historial: historial.map(mapHistorial),
  };
}

export interface ListarPedidosFiltros {
  estado?: string;
  idUsuario?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  pagina?: number;
  tamanoPagina?: number;
}

export async function listar(f: ListarPedidosFiltros = {}): Promise<PedidoDto[]> {
  const rows = await executeProcedure<PedidoDbRow[]>('SP_Pedidos_Listar', [
    { name: 'Estado', value: f.estado ?? null, type: sql.NVarChar(20) },
    { name: 'IDUsuario', value: f.idUsuario ?? null, type: sql.Int },
    { name: 'FechaDesde', value: f.fechaDesde ?? null, type: sql.DateTime2 },
    { name: 'FechaHasta', value: f.fechaHasta ?? null, type: sql.DateTime2 },
    { name: 'Pagina', value: f.pagina ?? 1, type: sql.Int },
    { name: 'TamanoPagina', value: f.tamanoPagina ?? 10, type: sql.Int },
  ]);
  return rows.map(mapPedido);
}

export async function listarPorCliente(
  idUsuario: number,
  pagina = 1,
  tamanoPagina = 10,
): Promise<PedidoDto[]> {
  const rows = await executeProcedure<PedidoDbRow[]>('SP_Pedidos_ListarPorCliente', [
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
    { name: 'Pagina', value: pagina, type: sql.Int },
    { name: 'TamanoPagina', value: tamanoPagina, type: sql.Int },
  ]);
  return rows.map(mapPedido);
}

export async function cambiarEstado(
  idPedido: number,
  estadoNuevo: string,
  idUsuario: number,
): Promise<{ id: number; estado: string }> {
  const rows = await executeProcedure<{ IDPedido: number; Estado: string }[]>(
    'SP_Pedidos_CambiarEstado',
    [
      { name: 'IDPedido', value: idPedido, type: sql.Int },
      { name: 'EstadoNuevo', value: estadoNuevo, type: sql.NVarChar(20) },
      { name: 'IDUsuario', value: idUsuario, type: sql.Int },
    ],
  );
  return { id: rows[0].IDPedido, estado: rows[0].Estado };
}

export async function registrarDevolucion(
  idPedido: number,
  lineas: { idDetallePedido: number; cantidad: number }[],
  idUsuario: number,
): Promise<void> {
  await executeProcedure('SP_Pedidos_RegistrarDevolucion', [
    { name: 'IDPedido', value: idPedido, type: sql.Int },
    { name: 'Lineas', value: JSON.stringify(lineas), type: sql.NVarChar(sql.MAX) },
    { name: 'IDUsuario', value: idUsuario, type: sql.Int },
  ]);
}
