-- ══════════════════════════════════════════════════════════════════════════
-- V006: Stored Procedures de Carrito (RF-04)
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Carrito_Crear
    @IDUsuario INT = NULL,
    @Token     NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @IDUsuario IS NULL AND @Token IS NULL
        THROW 50030, 'Debe indicar un usuario o un token de invitado.', 1;

    INSERT INTO $(SCHEMA).Carrito (IDUsuario, Token)
    VALUES (@IDUsuario, @Token);

    SELECT IDCarrito, IDUsuario, Token, FechaCreacion, FechaUltimaActividad
    FROM $(SCHEMA).Carrito
    WHERE IDCarrito = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_ObtenerPorUsuario
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1) IDCarrito, IDUsuario, Token, FechaCreacion, FechaUltimaActividad
    FROM $(SCHEMA).Carrito
    WHERE IDUsuario = @IDUsuario
    ORDER BY IDCarrito DESC;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_ObtenerPorToken
    @Token NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1) IDCarrito, IDUsuario, Token, FechaCreacion, FechaUltimaActividad
    FROM $(SCHEMA).Carrito
    WHERE Token = @Token
    ORDER BY IDCarrito DESC;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_ObtenerItems
    @IDCarrito INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT dc.IDDetalleCarrito,
           dc.IDCarrito,
           dc.IDVariante,
           dc.Cantidad,
           v.SKU,
           v.Precio,
           p.IDProducto,
           p.Nombre AS Producto,
           dc.Cantidad * v.Precio                          AS SubtotalLinea,
           SUM(dc.Cantidad * v.Precio) OVER()              AS Subtotal,
           ISNULL((SELECT SUM(r.Cantidad)
                   FROM $(SCHEMA).ReservaInventario r
                   WHERE r.IDVariante = v.IDVariante AND r.Estado = 'Activa'), 0) AS Reservado
    FROM $(SCHEMA).DetalleCarrito dc
    INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dc.IDVariante
    INNER JOIN $(SCHEMA).Producto p ON p.IDProducto = v.IDProducto
    WHERE dc.IDCarrito = @IDCarrito
    ORDER BY dc.IDDetalleCarrito;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_AgregarItem
    @IDCarrito  INT,
    @IDVariante INT,
    @Cantidad   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Cantidad <= 0
        THROW 50031, 'La cantidad debe ser mayor que cero.', 1;

    DECLARE @Disponible INT;
    SELECT @Disponible = v.Existencia - ISNULL(
        (SELECT SUM(r.Cantidad) FROM $(SCHEMA).ReservaInventario r
         WHERE r.IDVariante = v.IDVariante AND r.Estado = 'Activa'), 0)
    FROM $(SCHEMA).Variante v
    WHERE v.IDVariante = @IDVariante AND v.Activo = 1;

    IF @Disponible IS NULL
        THROW 50032, 'Variante no disponible.', 1;

    DECLARE @CantidadActual INT = (SELECT Cantidad FROM $(SCHEMA).DetalleCarrito
                                   WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante);
    DECLARE @CantidadNueva INT = ISNULL(@CantidadActual, 0) + @Cantidad;

    IF @CantidadNueva > @Disponible
        THROW 50033, 'No hay suficiente existencia disponible.', 1;

    IF @CantidadActual IS NOT NULL
        UPDATE $(SCHEMA).DetalleCarrito SET Cantidad = @CantidadNueva
        WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;
    ELSE
        INSERT INTO $(SCHEMA).DetalleCarrito (IDCarrito, IDVariante, Cantidad)
        VALUES (@IDCarrito, @IDVariante, @CantidadNueva);

    UPDATE $(SCHEMA).Carrito SET FechaUltimaActividad = SYSUTCDATETIME() WHERE IDCarrito = @IDCarrito;

    SELECT IDDetalleCarrito, IDCarrito, IDVariante, Cantidad
    FROM $(SCHEMA).DetalleCarrito
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_ActualizarItem
    @IDCarrito  INT,
    @IDVariante INT,
    @Cantidad   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Cantidad <= 0
        THROW 50031, 'La cantidad debe ser mayor que cero.', 1;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).DetalleCarrito WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante)
        THROW 50034, 'El producto no está en el carrito.', 1;

    DECLARE @Disponible INT;
    SELECT @Disponible = v.Existencia - ISNULL(
        (SELECT SUM(r.Cantidad) FROM $(SCHEMA).ReservaInventario r
         WHERE r.IDVariante = v.IDVariante AND r.Estado = 'Activa'), 0)
    FROM $(SCHEMA).Variante v
    WHERE v.IDVariante = @IDVariante AND v.Activo = 1;

    IF @Disponible IS NULL OR @Cantidad > @Disponible
        THROW 50033, 'No hay suficiente existencia disponible.', 1;

    UPDATE $(SCHEMA).DetalleCarrito SET Cantidad = @Cantidad
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    UPDATE $(SCHEMA).Carrito SET FechaUltimaActividad = SYSUTCDATETIME() WHERE IDCarrito = @IDCarrito;

    SELECT IDDetalleCarrito, IDCarrito, IDVariante, Cantidad
    FROM $(SCHEMA).DetalleCarrito
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_EliminarItem
    @IDCarrito  INT,
    @IDVariante INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM $(SCHEMA).DetalleCarrito
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    UPDATE $(SCHEMA).Carrito SET FechaUltimaActividad = SYSUTCDATETIME() WHERE IDCarrito = @IDCarrito;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Carrito_Limpiar
    @IDCarrito INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM $(SCHEMA).DetalleCarrito WHERE IDCarrito = @IDCarrito;
    UPDATE $(SCHEMA).Carrito SET FechaUltimaActividad = SYSUTCDATETIME() WHERE IDCarrito = @IDCarrito;
END;
GO
