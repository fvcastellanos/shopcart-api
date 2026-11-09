import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

// ── Mock del acceso a datos (repositorio de carrito) ─────────────────────
const obtenerItemsMock = mock.fn(async () => []);

await mock.module('../src/repositories/carrito.repository.js', {
  exports: {
    crear: mock.fn(),
    obtenerPorUsuario: mock.fn(),
    obtenerPorToken: mock.fn(),
    obtenerItems: obtenerItemsMock,
    agregarItem: mock.fn(),
    actualizarItem: mock.fn(),
    eliminarItem: mock.fn(),
    limpiar: mock.fn(),
  },
});

const { obtenerItems } = await import('../src/services/carrito.service.js');

test('obtenerItems devuelve los items y el subtotal', async () => {
  obtenerItemsMock.mock.mockImplementation(async () => [
    {
      id: 1,
      idCarrito: 1,
      idVariante: 11,
      cantidad: 2,
      sku: 'CAM-M-NEG',
      precio: 99.99,
      idProducto: 1,
      producto: 'Camiseta',
      subtotalLinea: 199.98,
      subtotal: 199.98,
      reservado: 0,
    },
  ]);

  const result = await obtenerItems(1);

  assert.equal(result.items.length, 1);
  assert.equal(result.subtotal, 199.98);
});

test('obtenerItems devuelve subtotal 0 cuando no hay items', async () => {
  obtenerItemsMock.mock.mockImplementation(async () => []);

  const result = await obtenerItems(1);

  assert.deepEqual(result, { items: [], subtotal: 0 });
});
