import swaggerJsdoc from 'swagger-jsdoc';
import { buildInfo } from '../lib/buildInfo.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${buildInfo.nombre} — API`,
      version: buildInfo.version,
      description:
        'API REST de ShopCart, plataforma web de ventas (reto Tech Challenge 360).\n' +
        'Acceso a datos exclusivamente mediante Stored Procedures. Autenticación con JWT.',
    },
    servers: [{ url: '/v1', description: 'Base de la API (v1)' }],
    tags: [
      { name: 'Actuator', description: 'Salud y metadata del servicio' },
      { name: 'Autenticación', description: 'Registro, login y renovación de tokens' },
      { name: 'Catálogo', description: 'Categorías, productos y variantes' },
      { name: 'Inventario', description: 'Existencia y kardex' },
      { name: 'Carrito', description: 'Carrito de compras' },
      { name: 'Cupones', description: 'Cupones y promociones' },
      { name: 'Direcciones', description: 'Direcciones de entrega' },
      { name: 'Reservas', description: 'Reservas de inventario' },
      { name: 'Pedidos', description: 'Pedidos y devoluciones' },
      { name: 'Dashboard', description: 'Reportes y métricas' },
      { name: 'Bitácora', description: 'Auditoría' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        // ── Genéricos ──
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        // ── Requests ──
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            nombre: { type: 'string' },
          },
        },
        CategoriaRequest: {
          type: 'object',
          required: ['nombre'],
          properties: { nombre: { type: 'string' } },
        },
        AtributoRequest: {
          type: 'object',
          required: ['nombre'],
          properties: { nombre: { type: 'string' } },
        },
        ProductoRequest: {
          type: 'object',
          required: ['nombre', 'idCategoria'],
          properties: {
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            idCategoria: { type: 'integer' },
          },
        },
        VarianteAtributoRequest: {
          type: 'object',
          required: ['idAtributo', 'valor'],
          properties: {
            idAtributo: { type: 'integer' },
            valor: { type: 'string' },
          },
        },
        VarianteRequest: {
          type: 'object',
          required: ['idProducto', 'sku', 'precio', 'existencia'],
          properties: {
            idProducto: { type: 'integer' },
            sku: { type: 'string' },
            precio: { type: 'number' },
            existencia: { type: 'integer' },
          },
        },
        CuponRequest: {
          type: 'object',
          required: ['codigo', 'tipo', 'valor', 'montoMinimo', 'fechaInicio', 'fechaFin'],
          properties: {
            codigo: { type: 'string' },
            tipo: { type: 'string', enum: ['Porcentaje', 'MontoFijo'] },
            valor: { type: 'number' },
            montoMinimo: { type: 'number' },
            fechaInicio: { type: 'string', format: 'date-time' },
            fechaFin: { type: 'string', format: 'date-time' },
            limiteTotalUsos: { type: 'integer', nullable: true },
            limiteUsoPorCliente: { type: 'integer', nullable: true },
            idCategoria: { type: 'integer', nullable: true },
          },
        },
        DireccionRequest: {
          type: 'object',
          required: ['linea1', 'ciudad', 'departamento', 'codigoPostal'],
          properties: {
            linea1: { type: 'string' },
            linea2: { type: 'string', nullable: true },
            ciudad: { type: 'string' },
            departamento: { type: 'string' },
            codigoPostal: { type: 'string' },
            referencia: { type: 'string', nullable: true },
            esPrincipal: { type: 'boolean' },
          },
        },
        ReservaRequest: {
          type: 'object',
          required: ['idCarrito'],
          properties: {
            idCarrito: { type: 'integer' },
            duracionMinutos: { type: 'integer' },
          },
        },
        PedidoRequest: {
          type: 'object',
          required: ['idCarrito', 'idDireccion', 'claveIdempotencia'],
          properties: {
            idCarrito: { type: 'integer' },
            idDireccion: { type: 'integer' },
            codigoCupon: { type: 'string' },
            claveIdempotencia: { type: 'string' },
          },
        },
        // ── Responses ──
        BuildInfo: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            version: { type: 'string' },
            commit: { type: 'string' },
            tag: { type: 'string' },
            branch: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
          },
        },
        VarianteAtributoDto: {
          type: 'object',
          properties: {
            idAtributo: { type: 'integer' },
            nombre: { type: 'string' },
            valor: { type: 'string' },
          },
        },
        CategoriaDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            activo: { type: 'boolean' },
          },
        },
        AtributoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            activo: { type: 'boolean' },
          },
        },
        ProductoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            idCategoria: { type: 'integer' },
            categoria: { type: 'string' },
            precioDesde: { type: 'number', nullable: true },
            precioHasta: { type: 'number', nullable: true },
            existenciaTotal: { type: 'integer', nullable: true },
            activo: { type: 'boolean' },
            totalRegistros: { type: 'integer' },
            variantes: { type: 'array', items: { $ref: '#/components/schemas/VarianteDto' } },
          },
        },
        VarianteDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idProducto: { type: 'integer' },
            sku: { type: 'string' },
            precio: { type: 'number' },
            existencia: { type: 'integer' },
            activo: { type: 'boolean' },
            atributos: { type: 'array', items: { $ref: '#/components/schemas/VarianteAtributoDto' } },
          },
        },
        ExistenciaDto: {
          type: 'object',
          properties: {
            idVariante: { type: 'integer' },
            sku: { type: 'string' },
            existenciaFisica: { type: 'integer' },
            existenciaReservada: { type: 'integer' },
            existenciaDisponible: { type: 'integer' },
          },
        },
        KardexDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idVariante: { type: 'integer' },
            tipoMovimiento: { type: 'string' },
            cantidad: { type: 'integer' },
            existenciaNueva: { type: 'integer' },
            motivo: { type: 'string', nullable: true },
            idUsuario: { type: 'integer' },
            usuario: { type: 'string' },
            fechaRegistro: { type: 'string', format: 'date-time' },
          },
        },
        CarritoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idUsuario: { type: 'integer', nullable: true },
            token: { type: 'string', nullable: true },
            fechaCreacion: { type: 'string', format: 'date-time' },
            fechaUltimaActividad: { type: 'string', format: 'date-time' },
          },
        },
        CarritoItemDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idCarrito: { type: 'integer' },
            idVariante: { type: 'integer' },
            cantidad: { type: 'integer' },
            sku: { type: 'string' },
            precio: { type: 'number' },
            idProducto: { type: 'integer' },
            producto: { type: 'string' },
            subtotalLinea: { type: 'number' },
            subtotal: { type: 'number' },
            reservado: { type: 'integer' },
          },
        },
        CuponDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            codigo: { type: 'string' },
            tipo: { type: 'string' },
            valor: { type: 'number' },
            montoMinimo: { type: 'number' },
            fechaInicio: { type: 'string', format: 'date-time' },
            fechaFin: { type: 'string', format: 'date-time' },
            limiteTotalUsos: { type: 'integer', nullable: true },
            limiteUsoPorCliente: { type: 'integer', nullable: true },
            totalUsos: { type: 'integer' },
            idCategoria: { type: 'integer', nullable: true },
            categoria: { type: 'string', nullable: true },
            activo: { type: 'boolean' },
          },
        },
        DireccionDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idUsuario: { type: 'integer' },
            linea1: { type: 'string' },
            linea2: { type: 'string', nullable: true },
            ciudad: { type: 'string' },
            departamento: { type: 'string' },
            codigoPostal: { type: 'string' },
            referencia: { type: 'string', nullable: true },
            esPrincipal: { type: 'boolean' },
            activo: { type: 'boolean' },
          },
        },
        ReservaDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idVariante: { type: 'integer' },
            cantidad: { type: 'integer' },
            estado: { type: 'string' },
            fechaExpiracion: { type: 'string', format: 'date-time' },
          },
        },
        PedidoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idUsuario: { type: 'integer' },
            correo: { type: 'string' },
            idDireccion: { type: 'integer' },
            idCupon: { type: 'integer', nullable: true },
            codigoCupon: { type: 'string', nullable: true },
            estado: { type: 'string' },
            subtotal: { type: 'number' },
            descuento: { type: 'number' },
            total: { type: 'number' },
            numeroSeguimiento: { type: 'string' },
            fechaCreacion: { type: 'string', format: 'date-time' },
          },
        },
        DetallePedidoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idVariante: { type: 'integer' },
            cantidad: { type: 'integer' },
            precioUnitario: { type: 'number' },
            descuentoLinea: { type: 'number' },
            cantidadDevuelta: { type: 'integer' },
            sku: { type: 'string' },
            producto: { type: 'string' },
          },
        },
        HistorialEstadoDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            estadoAnterior: { type: 'string', nullable: true },
            estadoNuevo: { type: 'string' },
            idUsuario: { type: 'integer' },
            usuario: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
          },
        },
        BitacoraDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            idUsuario: { type: 'integer' },
            usuario: { type: 'string' },
            entidad: { type: 'string' },
            accion: { type: 'string' },
            valorAnterior: { type: 'string', nullable: true },
            valorNuevo: { type: 'string', nullable: true },
            fecha: { type: 'string', format: 'date-time' },
          },
        },
        VentasPeriodoDto: {
          type: 'object',
          properties: {
            periodo: { type: 'string' },
            ventas: { type: 'number' },
            pedidos: { type: 'integer' },
          },
        },
        ProductoVendidoDto: {
          type: 'object',
          properties: {
            idProducto: { type: 'integer' },
            producto: { type: 'string' },
            unidadesVendidas: { type: 'integer' },
            totalVendido: { type: 'number' },
          },
        },
        ResumenDashboardDto: {
          type: 'object',
          properties: {
            totalVentas: { type: 'number' },
            totalPedidos: { type: 'integer' },
            ticketPromedio: { type: 'number' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
