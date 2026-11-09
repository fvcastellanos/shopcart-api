import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

// ── Mocks del acceso a datos (repositorios) ──────────────────────────────
const consultarProductoMock = mock.fn(async () => null);
const listarProductosMock = mock.fn(async () => []);
const listarVariantesMock = mock.fn(async () => []);

await mock.module('../src/repositories/producto.repository.js', {
  exports: {
    consultarProducto: consultarProductoMock,
    listarProductos: listarProductosMock,
    crearProducto: mock.fn(),
    modificarProducto: mock.fn(),
    desactivarProducto: mock.fn(),
  },
});

await mock.module('../src/repositories/variante.repository.js', {
  exports: {
    listarVariantes: listarVariantesMock,
  },
});

const { consultarProductoConVariantes, listarProductos } = await import(
  '../src/services/producto.service.js'
);

test('consultarProductoConVariantes lanza NotFoundError si el producto no existe', async () => {
  consultarProductoMock.mock.mockImplementation(async () => null);

  await assert.rejects(() => consultarProductoConVariantes(999), (err: unknown) => {
    assert.equal((err as { statusCode?: number }).statusCode, 404);
    assert.equal((err as { code?: string }).code, 'NOT_FOUND');
    return true;
  });
});

test('consultarProductoConVariantes devuelve el producto con sus variantes', async () => {
  consultarProductoMock.mock.mockImplementation(async () => ({
    id: 1,
    nombre: 'Camiseta',
    descripcion: null,
    idCategoria: 2,
    categoria: 'Ropa',
    precioDesde: 99.99,
    precioHasta: 129.99,
    existenciaTotal: 10,
    activo: true,
  }));
  listarVariantesMock.mock.mockImplementation(async () => [
    {
      id: 11,
      idProducto: 1,
      sku: 'CAM-M-NEG',
      precio: 99.99,
      existencia: 5,
      activo: true,
      atributos: [{ idAtributo: 1, nombre: 'Color', valor: 'Negro' }],
    },
  ]);

  const result = await consultarProductoConVariantes(1);

  assert.equal(result.id, 1);
  assert.equal(result.variantes.length, 1);
  assert.equal(result.variantes[0].sku, 'CAM-M-NEG');
});

test('listarProductos convierte soloDisponibles a booleano', async () => {
  let filtrosRecibidos: { soloDisponibles: boolean } | undefined;
  listarProductosMock.mock.mockImplementation(async (filtros) => {
    filtrosRecibidos = filtros as { soloDisponibles: boolean };
    return [];
  });

  await listarProductos({ soloDisponibles: '1' });

  assert.equal(filtrosRecibidos?.soloDisponibles, true);
});
