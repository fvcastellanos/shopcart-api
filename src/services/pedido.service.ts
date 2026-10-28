import * as pedidoRepository from '../repositories/pedido.repository.js';
import type {
  DetallePedidoDto,
  HistorialEstadoDto,
  ListarPedidosFiltros,
  PedidoDto,
} from '../repositories/pedido.repository.js';
import type { AuthUser } from '../types/auth.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';

export function crearPedido(
  input: {
    idCarrito: number;
    idDireccion: number;
    codigoCupon?: string;
    claveIdempotencia: string;
  },
  idUsuario: number,
): Promise<PedidoDto> {
  return pedidoRepository.crearPedido(
    input.idCarrito,
    input.idDireccion,
    input.codigoCupon ?? null,
    input.claveIdempotencia,
    idUsuario,
  );
}

export async function consultar(
  idPedido: number,
  user: AuthUser,
): Promise<{ pedido: PedidoDto; detalle: DetallePedidoDto[]; historial: HistorialEstadoDto[] }> {
  const resultado = await pedidoRepository.consultar(idPedido);
  if (!resultado.pedido) {
    throw new NotFoundError('Pedido no encontrado.');
  }
  // Un Cliente solo puede consultar sus propios pedidos.
  if (user.rol === 'Cliente' && resultado.pedido.idUsuario !== user.id) {
    throw new ForbiddenError('No puedes consultar pedidos de otro cliente.');
  }
  return resultado as {
    pedido: PedidoDto;
    detalle: DetallePedidoDto[];
    historial: HistorialEstadoDto[];
  };
}

export function listar(filtros: ListarPedidosFiltros = {}): Promise<PedidoDto[]> {
  return pedidoRepository.listar(filtros);
}

export function listarPorCliente(
  idUsuario: number,
  pagina = 1,
  tamanoPagina = 10,
): Promise<PedidoDto[]> {
  return pedidoRepository.listarPorCliente(idUsuario, pagina, tamanoPagina);
}

export function cambiarEstado(
  idPedido: number,
  estadoNuevo: string,
  idUsuario: number,
): Promise<{ id: number; estado: string }> {
  return pedidoRepository.cambiarEstado(idPedido, estadoNuevo, idUsuario);
}

export function registrarDevolucion(
  idPedido: number,
  lineas: { idDetallePedido: number; cantidad: number }[],
  idUsuario: number,
): Promise<void> {
  return pedidoRepository.registrarDevolucion(idPedido, lineas, idUsuario);
}
