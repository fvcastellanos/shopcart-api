-- ══════════════════════════════════════════════════════════════════════════
-- V001: Esquema base de ShopCart
-- Crea todas las tablas, llaves, restricciones e índices del modelo relacional.
--
-- Convenciones:
--   · Tablas en singular (Producto, Categoria, Pedido...).
--   · PK autoincrementable: ID + nombre (IDProducto, IDCategoria...).
--   · Restricciones: PK_, FK_, UQ_, DF_ (default), CHK_ (check), IX_ (índice).
--   · Montos en DECIMAL, cantidades en INT (nunca FLOAT/REAL).
--   · `$(SCHEMA)` se sustituye por el esquema configurado (DB_SCHEMA).
-- ══════════════════════════════════════════════════════════════════════════


-- ── RF-01 · Autenticación y control de acceso ───────────────────────────────
CREATE TABLE $(SCHEMA).Rol (
    IDRol       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Rol PRIMARY KEY,
    Nombre      NVARCHAR(50)      NOT NULL CONSTRAINT UQ_Rol_Nombre UNIQUE,
    Descripcion NVARCHAR(255)     NULL,
    Activo      BIT               NOT NULL CONSTRAINT DF_Rol_Activo DEFAULT 1
);
GO

CREATE TABLE $(SCHEMA).Usuario (
    IDUsuario     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuario PRIMARY KEY,
    Correo        NVARCHAR(255)     NOT NULL CONSTRAINT UQ_Usuario_Correo UNIQUE,
    PasswordHash  NVARCHAR(255)     NOT NULL,
    Nombre        NVARCHAR(150)     NOT NULL,
    IDRol         INT               NOT NULL CONSTRAINT FK_Usuario_Rol REFERENCES $(SCHEMA).Rol (IDRol),
    Activo        BIT               NOT NULL CONSTRAINT DF_Usuario_Activo DEFAULT 1,
    FechaCreacion DATETIME2         NOT NULL CONSTRAINT DF_Usuario_FechaCreacion DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Usuario_Rol ON $(SCHEMA).Usuario (IDRol);
GO

CREATE TABLE $(SCHEMA).TokenSesion (
    IDTokenSesion    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TokenSesion PRIMARY KEY,
    IDUsuario        INT               NOT NULL CONSTRAINT FK_TokenSesion_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    RefreshTokenHash NVARCHAR(255)     NOT NULL,
    FechaExpiracion  DATETIME2         NOT NULL,
    Revocado         BIT               NOT NULL CONSTRAINT DF_TokenSesion_Revocado DEFAULT 0,
    FechaCreacion    DATETIME2         NOT NULL CONSTRAINT DF_TokenSesion_FechaCreacion DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_TokenSesion_Usuario ON $(SCHEMA).TokenSesion (IDUsuario);
GO


-- ── RF-02 · Catálogo de productos ────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Categoria (
    IDCategoria INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categoria PRIMARY KEY,
    Nombre      NVARCHAR(100)     NOT NULL CONSTRAINT UQ_Categoria_Nombre UNIQUE,
    Activo      BIT               NOT NULL CONSTRAINT DF_Categoria_Activo DEFAULT 1
);
GO

CREATE TABLE $(SCHEMA).Producto (
    IDProducto    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Producto PRIMARY KEY,
    Nombre        NVARCHAR(200)     NOT NULL,
    Descripcion   NVARCHAR(MAX)     NULL,
    IDCategoria   INT               NOT NULL CONSTRAINT FK_Producto_Categoria REFERENCES $(SCHEMA).Categoria (IDCategoria),
    Activo        BIT               NOT NULL CONSTRAINT DF_Producto_Activo DEFAULT 1,
    FechaCreacion DATETIME2         NOT NULL CONSTRAINT DF_Producto_FechaCreacion DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Producto_Categoria ON $(SCHEMA).Producto (IDCategoria);
GO

CREATE TABLE $(SCHEMA).Variante (
    IDVariante INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Variante PRIMARY KEY,
    IDProducto INT               NOT NULL CONSTRAINT FK_Variante_Producto REFERENCES $(SCHEMA).Producto (IDProducto),
    SKU        NVARCHAR(50)      NOT NULL CONSTRAINT UQ_Variante_SKU UNIQUE,
    Precio     DECIMAL(10,2)     NOT NULL CONSTRAINT CHK_Variante_Precio CHECK (Precio >= 0),
    Existencia INT               NOT NULL CONSTRAINT DF_Variante_Existencia DEFAULT 0,
    Activo     BIT               NOT NULL CONSTRAINT DF_Variante_Activo DEFAULT 1,
    CONSTRAINT CHK_Variante_Existencia CHECK (Existencia >= 0)
);
CREATE INDEX IX_Variante_Producto ON $(SCHEMA).Variante (IDProducto);
GO

CREATE TABLE $(SCHEMA).VarianteAtributo (
    IDVarianteAtributo INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VarianteAtributo PRIMARY KEY,
    IDVariante         INT               NOT NULL CONSTRAINT FK_VarianteAtributo_Variante REFERENCES $(SCHEMA).Variante (IDVariante),
    Nombre             NVARCHAR(50)      NOT NULL,
    Valor              NVARCHAR(100)     NOT NULL
);
CREATE INDEX IX_VarianteAtributo_Variante ON $(SCHEMA).VarianteAtributo (IDVariante);
GO

CREATE TABLE $(SCHEMA).ProductoImagen (
    IDProductoImagen INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProductoImagen PRIMARY KEY,
    IDProducto       INT               NOT NULL CONSTRAINT FK_ProductoImagen_Producto REFERENCES $(SCHEMA).Producto (IDProducto),
    URL              NVARCHAR(500)     NOT NULL,
    EsPrincipal      BIT               NOT NULL CONSTRAINT DF_ProductoImagen_EsPrincipal DEFAULT 0,
    Orden            INT               NOT NULL CONSTRAINT DF_ProductoImagen_Orden DEFAULT 0
);
CREATE INDEX IX_ProductoImagen_Producto ON $(SCHEMA).ProductoImagen (IDProducto);
GO


-- ── RF-04 · Carrito de compras ───────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Carrito (
    IDCarrito           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Carrito PRIMARY KEY,
    IDUsuario           INT               NULL     CONSTRAINT FK_Carrito_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    Token               NVARCHAR(64)      NULL     CONSTRAINT UQ_Carrito_Token UNIQUE,
    FechaCreacion       DATETIME2         NOT NULL CONSTRAINT DF_Carrito_FechaCreacion DEFAULT SYSUTCDATETIME(),
    FechaUltimaActividad DATETIME2        NOT NULL CONSTRAINT DF_Carrito_FechaUltimaActividad DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Carrito_Usuario ON $(SCHEMA).Carrito (IDUsuario);
GO

CREATE TABLE $(SCHEMA).DetalleCarrito (
    IDDetalleCarrito INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DetalleCarrito PRIMARY KEY,
    IDCarrito        INT               NOT NULL CONSTRAINT FK_DetalleCarrito_Carrito REFERENCES $(SCHEMA).Carrito (IDCarrito),
    IDVariante       INT               NOT NULL CONSTRAINT FK_DetalleCarrito_Variante REFERENCES $(SCHEMA).Variante (IDVariante),
    Cantidad         INT               NOT NULL,
    CONSTRAINT UQ_DetalleCarrito_Item UNIQUE (IDCarrito, IDVariante),
    CONSTRAINT CHK_DetalleCarrito_Cantidad CHECK (Cantidad > 0)
);
CREATE INDEX IX_DetalleCarrito_Carrito ON $(SCHEMA).DetalleCarrito (IDCarrito);
CREATE INDEX IX_DetalleCarrito_Variante ON $(SCHEMA).DetalleCarrito (IDVariante);
GO


-- ── RF-05 · Cupones y promociones ────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Cupon (
    IDCupon             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Cupon PRIMARY KEY,
    Codigo              NVARCHAR(50)      NOT NULL CONSTRAINT UQ_Cupon_Codigo UNIQUE,
    Tipo                NVARCHAR(20)      NOT NULL CONSTRAINT CHK_Cupon_Tipo CHECK (Tipo IN ('Porcentaje', 'MontoFijo')),
    Valor               DECIMAL(10,2)     NOT NULL,
    MontoMinimo         DECIMAL(10,2)     NOT NULL CONSTRAINT DF_Cupon_MontoMinimo DEFAULT 0,
    FechaInicio         DATETIME2         NOT NULL,
    FechaFin            DATETIME2         NOT NULL,
    LimiteTotalUsos     INT               NULL,
    LimiteUsoPorCliente INT               NULL,
    TotalUsos           INT               NOT NULL CONSTRAINT DF_Cupon_TotalUsos DEFAULT 0,
    IDCategoria         INT               NULL     CONSTRAINT FK_Cupon_Categoria REFERENCES $(SCHEMA).Categoria (IDCategoria),
    Activo              BIT               NOT NULL CONSTRAINT DF_Cupon_Activo DEFAULT 1,
    CONSTRAINT CHK_Cupon_Valor CHECK (
        (Tipo = 'Porcentaje' AND Valor > 0 AND Valor <= 100) OR
        (Tipo = 'MontoFijo'  AND Valor >= 0)
    ),
    CONSTRAINT CHK_Cupon_TotalUsos CHECK (TotalUsos >= 0),
    CONSTRAINT CHK_Cupon_MontoMinimo CHECK (MontoMinimo >= 0)
);
CREATE INDEX IX_Cupon_Categoria ON $(SCHEMA).Cupon (IDCategoria);
GO


-- ── RF-06 · Direcciones de entrega ───────────────────────────────────────────
CREATE TABLE $(SCHEMA).Direccion (
    IDDireccion  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Direccion PRIMARY KEY,
    IDUsuario    INT               NOT NULL CONSTRAINT FK_Direccion_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    Linea1       NVARCHAR(200)     NOT NULL,
    Linea2       NVARCHAR(200)     NULL,
    Ciudad       NVARCHAR(100)     NOT NULL,
    Departamento NVARCHAR(100)     NOT NULL,
    CodigoPostal NVARCHAR(20)      NOT NULL,
    Referencia   NVARCHAR(255)     NULL,
    EsPrincipal  BIT               NOT NULL CONSTRAINT DF_Direccion_EsPrincipal DEFAULT 0,
    Activo       BIT               NOT NULL CONSTRAINT DF_Direccion_Activo DEFAULT 1,
    FechaCreacion DATETIME2        NOT NULL CONSTRAINT DF_Direccion_FechaCreacion DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Direccion_Usuario ON $(SCHEMA).Direccion (IDUsuario);
GO


-- ── RF-06 · Reservas de inventario ───────────────────────────────────────────
CREATE TABLE $(SCHEMA).ReservaInventario (
    IDReservaInventario INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ReservaInventario PRIMARY KEY,
    IDVariante          INT               NOT NULL CONSTRAINT FK_ReservaInventario_Variante REFERENCES $(SCHEMA).Variante (IDVariante),
    IDCarrito           INT               NULL     CONSTRAINT FK_ReservaInventario_Carrito REFERENCES $(SCHEMA).Carrito (IDCarrito),
    Cantidad            INT               NOT NULL CONSTRAINT CHK_Reserva_Cantidad CHECK (Cantidad > 0),
    Estado              NVARCHAR(20)      NOT NULL CONSTRAINT DF_Reserva_Estado DEFAULT 'Activa',
    FechaReserva        DATETIME2         NOT NULL CONSTRAINT DF_Reserva_FechaReserva DEFAULT SYSUTCDATETIME(),
    FechaExpiracion     DATETIME2         NOT NULL,
    CONSTRAINT CHK_Reserva_Estado CHECK (Estado IN ('Activa', 'Consumida', 'Liberada', 'Vencida'))
);
CREATE INDEX IX_ReservaInventario_Variante ON $(SCHEMA).ReservaInventario (IDVariante);
CREATE INDEX IX_ReservaInventario_Estado ON $(SCHEMA).ReservaInventario (Estado);
GO


-- ── RF-06/07 · Pedidos ───────────────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Pedido (
    IDPedido           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Pedido PRIMARY KEY,
    IDUsuario          INT               NOT NULL CONSTRAINT FK_Pedido_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    IDDireccion        INT               NOT NULL CONSTRAINT FK_Pedido_Direccion REFERENCES $(SCHEMA).Direccion (IDDireccion),
    IDCupon            INT               NULL     CONSTRAINT FK_Pedido_Cupon REFERENCES $(SCHEMA).Cupon (IDCupon),
    Estado             NVARCHAR(20)      NOT NULL CONSTRAINT DF_Pedido_Estado DEFAULT 'Confirmado',
    Subtotal           DECIMAL(12,2)     NOT NULL CONSTRAINT DF_Pedido_Subtotal DEFAULT 0,
    Descuento          DECIMAL(12,2)     NOT NULL CONSTRAINT DF_Pedido_Descuento DEFAULT 0,
    Total              DECIMAL(12,2)     NOT NULL CONSTRAINT DF_Pedido_Total DEFAULT 0,
    NumeroSeguimiento  NVARCHAR(50)      NOT NULL CONSTRAINT UQ_Pedido_NumeroSeguimiento UNIQUE,
    ClaveIdempotencia  NVARCHAR(64)      NOT NULL CONSTRAINT UQ_Pedido_ClaveIdempotencia UNIQUE,
    FechaCreacion      DATETIME2         NOT NULL CONSTRAINT DF_Pedido_FechaCreacion DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_Pedido_Estado CHECK (Estado IN ('Confirmado', 'EnPreparacion', 'Despachado', 'Entregado', 'Cancelado')),
    CONSTRAINT CHK_Pedido_Total CHECK (Total >= 0)
);
CREATE INDEX IX_Pedido_Usuario ON $(SCHEMA).Pedido (IDUsuario);
CREATE INDEX IX_Pedido_Estado ON $(SCHEMA).Pedido (Estado);
GO

CREATE TABLE $(SCHEMA).DetallePedido (
    IDDetallePedido  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DetallePedido PRIMARY KEY,
    IDPedido         INT               NOT NULL CONSTRAINT FK_DetallePedido_Pedido REFERENCES $(SCHEMA).Pedido (IDPedido),
    IDVariante       INT               NOT NULL CONSTRAINT FK_DetallePedido_Variante REFERENCES $(SCHEMA).Variante (IDVariante),
    Cantidad         INT               NOT NULL CONSTRAINT CHK_DetallePedido_Cantidad CHECK (Cantidad > 0),
    PrecioUnitario   DECIMAL(10,2)     NOT NULL,
    DescuentoLinea   DECIMAL(10,2)     NOT NULL CONSTRAINT DF_DetallePedido_DescuentoLinea DEFAULT 0,
    CantidadDevuelta INT               NOT NULL CONSTRAINT DF_DetallePedido_CantidadDevuelta DEFAULT 0,
    CONSTRAINT CHK_DetallePedido_Devuelta CHECK (CantidadDevuelta >= 0)
);
CREATE INDEX IX_DetallePedido_Pedido ON $(SCHEMA).DetallePedido (IDPedido);
CREATE INDEX IX_DetallePedido_Variante ON $(SCHEMA).DetallePedido (IDVariante);
GO

CREATE TABLE $(SCHEMA).HistorialEstadoPedido (
    IDHistorialEstadoPedido INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistorialEstadoPedido PRIMARY KEY,
    IDPedido                INT               NOT NULL CONSTRAINT FK_HistorialEstadoPedido_Pedido REFERENCES $(SCHEMA).Pedido (IDPedido),
    EstadoAnterior          NVARCHAR(20)      NULL,
    EstadoNuevo             NVARCHAR(20)      NOT NULL,
    IDUsuario               INT               NOT NULL CONSTRAINT FK_HistorialEstadoPedido_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    Fecha                   DATETIME2         NOT NULL CONSTRAINT DF_HistorialEstadoPedido_Fecha DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_HistorialEstadoPedido_Pedido ON $(SCHEMA).HistorialEstadoPedido (IDPedido);
GO

CREATE TABLE $(SCHEMA).CuponUso (
    IDCuponUso INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CuponUso PRIMARY KEY,
    IDCupon    INT               NOT NULL CONSTRAINT FK_CuponUso_Cupon REFERENCES $(SCHEMA).Cupon (IDCupon),
    IDUsuario  INT               NOT NULL CONSTRAINT FK_CuponUso_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    IDPedido   INT               NOT NULL CONSTRAINT FK_CuponUso_Pedido REFERENCES $(SCHEMA).Pedido (IDPedido),
    FechaUso   DATETIME2         NOT NULL CONSTRAINT DF_CuponUso_FechaUso DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_CuponUso_Cupon ON $(SCHEMA).CuponUso (IDCupon);
CREATE INDEX IX_CuponUso_Usuario ON $(SCHEMA).CuponUso (IDUsuario);
GO


-- ── RF-03 · Inventario (Kardex) ──────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Kardex (
    IDKardex       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kardex PRIMARY KEY,
    IDVariante     INT               NOT NULL CONSTRAINT FK_Kardex_Variante REFERENCES $(SCHEMA).Variante (IDVariante),
    TipoMovimiento NVARCHAR(20)      NOT NULL,
    Cantidad       INT               NOT NULL,
    ExistenciaNueva INT              NOT NULL,
    Motivo         NVARCHAR(255)     NULL,
    IDUsuario      INT               NOT NULL CONSTRAINT FK_Kardex_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    FechaRegistro  DATETIME2         NOT NULL CONSTRAINT DF_Kardex_FechaRegistro DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_Kardex_Tipo CHECK (TipoMovimiento IN ('EntradaCompra', 'SalidaVenta', 'Ajuste', 'Devolucion')),
    CONSTRAINT CHK_Kardex_ExistenciaNueva CHECK (ExistenciaNueva >= 0)
);
CREATE INDEX IX_Kardex_Variante ON $(SCHEMA).Kardex (IDVariante);
GO


-- ── RF-09 · Bitácora (auditoría) ─────────────────────────────────────────────
CREATE TABLE $(SCHEMA).Bitacora (
    IDBitacora    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Bitacora PRIMARY KEY,
    IDUsuario     INT               NOT NULL CONSTRAINT FK_Bitacora_Usuario REFERENCES $(SCHEMA).Usuario (IDUsuario),
    Entidad       NVARCHAR(100)     NOT NULL,
    Accion        NVARCHAR(20)      NOT NULL,
    ValorAnterior NVARCHAR(MAX)     NULL,
    ValorNuevo    NVARCHAR(MAX)     NULL,
    Fecha         DATETIME2         NOT NULL CONSTRAINT DF_Bitacora_Fecha DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_Bitacora_Accion CHECK (Accion IN ('Crear', 'Modificar', 'Desactivar'))
);
CREATE INDEX IX_Bitacora_Entidad ON $(SCHEMA).Bitacora (Entidad);
CREATE INDEX IX_Bitacora_Usuario ON $(SCHEMA).Bitacora (IDUsuario);
GO
