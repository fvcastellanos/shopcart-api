-- ══════════════════════════════════════════════════════════════════════════
-- V008: Direcciones, Reservas de inventario y Checkout (RF-06)
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Direccion_ListarPorUsuario
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDDireccion, IDUsuario, Linea1, Linea2, Ciudad, Departamento, CodigoPostal,
           Referencia, EsPrincipal, Activo
    FROM $(SCHEMA).Direccion
    WHERE IDUsuario = @IDUsuario
    ORDER BY EsPrincipal DESC, IDDireccion;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Direccion_Consultar
    @IDDireccion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDDireccion, IDUsuario, Linea1, Linea2, Ciudad, Departamento, CodigoPostal,
           Referencia, EsPrincipal, Activo
    FROM $(SCHEMA).Direccion
    WHERE IDDireccion = @IDDireccion;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Direccion_Crear
    @IDUsuario    INT,
    @Linea1       NVARCHAR(200),
    @Linea2       NVARCHAR(200) = NULL,
    @Ciudad       NVARCHAR(100),
    @Departamento NVARCHAR(100),
    @CodigoPostal NVARCHAR(20),
    @Referencia   NVARCHAR(255) = NULL,
    @EsPrincipal  BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @EsPrincipal = 1
        UPDATE $(SCHEMA).Direccion SET EsPrincipal = 0 WHERE IDUsuario = @IDUsuario;

    INSERT INTO $(SCHEMA).Direccion (IDUsuario, Linea1, Linea2, Ciudad, Departamento, CodigoPostal, Referencia, EsPrincipal)
    VALUES (@IDUsuario, @Linea1, @Linea2, @Ciudad, @Departamento, @CodigoPostal, @Referencia, @EsPrincipal);

    SELECT IDDireccion, IDUsuario, Linea1, Linea2, Ciudad, Departamento, CodigoPostal,
           Referencia, EsPrincipal, Activo
    FROM $(SCHEMA).Direccion
    WHERE IDDireccion = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Direccion_Modificar
    @IDDireccion  INT,
    @Linea1       NVARCHAR(200),
    @Linea2       NVARCHAR(200) = NULL,
    @Ciudad       NVARCHAR(100),
    @Departamento NVARCHAR(100),
    @CodigoPostal NVARCHAR(20),
    @Referencia   NVARCHAR(255) = NULL,
    @EsPrincipal  BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IDUsuario INT = (SELECT IDUsuario FROM $(SCHEMA).Direccion WHERE IDDireccion = @IDDireccion);
    IF @IDUsuario IS NULL
        THROW 50061, 'Dirección no encontrada.', 1;

    IF @EsPrincipal = 1
        UPDATE $(SCHEMA).Direccion SET EsPrincipal = 0 WHERE IDUsuario = @IDUsuario AND IDDireccion <> @IDDireccion;

    UPDATE $(SCHEMA).Direccion
    SET Linea1 = @Linea1, Linea2 = @Linea2, Ciudad = @Ciudad, Departamento = @Departamento,
        CodigoPostal = @CodigoPostal, Referencia = @Referencia, EsPrincipal = @EsPrincipal
    WHERE IDDireccion = @IDDireccion;

    SELECT IDDireccion, IDUsuario, Linea1, Linea2, Ciudad, Departamento, CodigoPostal,
           Referencia, EsPrincipal, Activo
    FROM $(SCHEMA).Direccion
    WHERE IDDireccion = @IDDireccion;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Direccion_Desactivar
    @IDDireccion INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Direccion WHERE IDDireccion = @IDDireccion)
        THROW 50061, 'Dirección no encontrada.', 1;

    UPDATE $(SCHEMA).Direccion SET Activo = 0 WHERE IDDireccion = @IDDireccion;
END;
GO

-- ── Reservas de inventario ───────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Inventario_ReservarExistencia
    @IDCarrito       INT,
    @DuracionMinutos INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    -- Libera reservas previas del mismo carrito (reintento de checkout).
    UPDATE $(SCHEMA).ReservaInventario SET Estado = 'Liberada'
    WHERE IDCarrito = @IDCarrito AND Estado = 'Activa';

    DECLARE @IDVariante INT, @Cantidad INT;
    DECLARE cur CURSOR LOCAL FOR
        SELECT IDVariante, Cantidad FROM $(SCHEMA).DetalleCarrito WHERE IDCarrito = @IDCarrito;
    OPEN cur;
    FETCH NEXT FROM cur INTO @IDVariante, @Cantidad;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @Disponible INT;
        SELECT @Disponible = v.Existencia - ISNULL(
            (SELECT SUM(r.Cantidad) FROM $(SCHEMA).ReservaInventario r
             WHERE r.IDVariante = v.IDVariante AND r.Estado = 'Activa'), 0)
        FROM $(SCHEMA).Variante v
        WHERE v.IDVariante = @IDVariante;

        IF @Disponible < @Cantidad
            THROW 50060, 'No hay suficiente existencia para reservar una o más variantes.', 1;

        INSERT INTO $(SCHEMA).ReservaInventario (IDVariante, IDCarrito, Cantidad, Estado, FechaExpiracion)
        VALUES (@IDVariante, @IDCarrito, @Cantidad, 'Activa', DATEADD(MINUTE, @DuracionMinutos, SYSUTCDATETIME()));

        FETCH NEXT FROM cur INTO @IDVariante, @Cantidad;
    END;
    CLOSE cur;
    DEALLOCATE cur;

    COMMIT;

    SELECT IDReservaInventario, IDVariante, Cantidad, Estado, FechaExpiracion
    FROM $(SCHEMA).ReservaInventario
    WHERE IDCarrito = @IDCarrito AND Estado = 'Activa';
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Inventario_LiberarReservasVencidas
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE $(SCHEMA).ReservaInventario
    SET Estado = 'Vencida'
    WHERE Estado = 'Activa' AND FechaExpiracion < SYSUTCDATETIME();
END;
GO

-- ── Checkout: creación atómica del pedido ────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Pedidos_CrearPedido
    @IDCarrito        INT,
    @IDDireccion      INT,
    @CodigoCupon      NVARCHAR(50) = NULL,
    @ClaveIdempotencia NVARCHAR(64),
    @IDUsuario        INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Idempotencia: si ya existe un pedido con esta clave, se devuelve el existente.
    IF EXISTS (SELECT 1 FROM $(SCHEMA).Pedido WHERE ClaveIdempotencia = @ClaveIdempotencia)
    BEGIN
        SELECT IDPedido, Estado, Subtotal, Descuento, Total, NumeroSeguimiento, FechaCreacion
        FROM $(SCHEMA).Pedido
        WHERE ClaveIdempotencia = @ClaveIdempotencia;
        RETURN;
    END;

    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Carrito WHERE IDCarrito = @IDCarrito)
        THROW 50040, 'Carrito no encontrado.', 1;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Direccion WHERE IDDireccion = @IDDireccion AND IDUsuario = @IDUsuario AND Activo = 1)
        THROW 50041, 'Dirección no válida.', 1;

    DECLARE @Items TABLE (IDVariante INT, Cantidad INT, PrecioUnitario DECIMAL(10,2));
    INSERT INTO @Items (IDVariante, Cantidad, PrecioUnitario)
    SELECT dc.IDVariante, dc.Cantidad, v.Precio
    FROM $(SCHEMA).DetalleCarrito dc
    INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dc.IDVariante AND v.Activo = 1
    WHERE dc.IDCarrito = @IDCarrito;

    IF NOT EXISTS (SELECT 1 FROM @Items)
        THROW 50042, 'El carrito está vacío.', 1;

    DECLARE @Subtotal DECIMAL(12,2) = (SELECT SUM(Cantidad * PrecioUnitario) FROM @Items);

    -- ── Validación y cálculo de cupón ──
    DECLARE @Descuento DECIMAL(12,2) = 0;
    DECLARE @IDCupon   INT = NULL;

    IF @CodigoCupon IS NOT NULL
    BEGIN
        DECLARE @CuponTipo NVARCHAR(20), @CuponValor DECIMAL(10,2), @CuponMontoMinimo DECIMAL(10,2),
                @CuponInicio DATETIME2, @CuponFin DATETIME2, @CuponLimiteTotal INT, @CuponLimiteCliente INT,
                @CuponTotalUsos INT, @CuponCategoria INT, @CuponActivo BIT;

        SELECT @CuponTipo = Tipo, @CuponValor = Valor, @CuponMontoMinimo = MontoMinimo,
               @CuponInicio = FechaInicio, @CuponFin = FechaFin,
               @CuponLimiteTotal = LimiteTotalUsos, @CuponLimiteCliente = LimiteUsoPorCliente,
               @CuponTotalUsos = TotalUsos, @CuponCategoria = IDCategoria, @CuponActivo = Activo,
               @IDCupon = IDCupon
        FROM $(SCHEMA).Cupon
        WHERE Codigo = @CodigoCupon;

        IF @IDCupon IS NULL THROW 50053, 'Cupón no encontrado.', 1;
        IF @CuponActivo = 0 THROW 50054, 'Cupón inactivo.', 1;
        IF SYSUTCDATETIME() < @CuponInicio THROW 50055, 'Cupón aún no vigente.', 1;
        IF SYSUTCDATETIME() > @CuponFin THROW 50056, 'Cupón vencido.', 1;
        IF @Subtotal < @CuponMontoMinimo THROW 50057, 'No cumple el monto mínimo para este cupón.', 1;
        IF @CuponLimiteTotal IS NOT NULL AND @CuponTotalUsos >= @CuponLimiteTotal THROW 50058, 'Cupón agotado.', 1;

        DECLARE @UsosCliente INT = (SELECT COUNT(*) FROM $(SCHEMA).CuponUso WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario);
        IF @CuponLimiteCliente IS NOT NULL AND @UsosCliente >= @CuponLimiteCliente
            THROW 50059, 'Ya alcanzaste el límite de usos de este cupón.', 1;

        -- Subtotal aplicable: todo el carrito o solo la categoría del cupón.
        DECLARE @SubtotalAplicable DECIMAL(12,2) = @Subtotal;
        IF @CuponCategoria IS NOT NULL
        BEGIN
            SELECT @SubtotalAplicable = ISNULL(SUM(i.Cantidad * i.PrecioUnitario), 0)
            FROM @Items i
            INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = i.IDVariante
            INNER JOIN $(SCHEMA).Producto p ON p.IDProducto = v.IDProducto
            WHERE p.IDCategoria = @CuponCategoria;
        END;

        SELECT @Descuento = f.Descuento
        FROM $(SCHEMA).FU_Cupones_CalculoDescuento(@CuponTipo, @CuponValor, @SubtotalAplicable) f;
    END;

    DECLARE @Total DECIMAL(12,2) = @Subtotal - @Descuento;
    IF @Total < 0 SET @Total = 0;

    DECLARE @NumeroSeguimiento NVARCHAR(50) =
        'SC-' + CONVERT(NVARCHAR(8), SYSUTCDATETIME(), 112) + '-' +
        UPPER(LEFT(REPLACE(CONVERT(NVARCHAR(36), NEWID()), '-', ''), 8));

    INSERT INTO $(SCHEMA).Pedido
        (IDUsuario, IDDireccion, IDCupon, Estado, Subtotal, Descuento, Total, NumeroSeguimiento, ClaveIdempotencia)
    VALUES
        (@IDUsuario, @IDDireccion, @IDCupon, 'Confirmado', @Subtotal, @Descuento, @Total, @NumeroSeguimiento, @ClaveIdempotencia);

    DECLARE @IDPedido INT = SCOPE_IDENTITY();

    INSERT INTO $(SCHEMA).HistorialEstadoPedido (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario)
    VALUES (@IDPedido, NULL, 'Confirmado', @IDUsuario);

    -- Descuenta existencia (atómico, evita sobreventa), detalle, kardex y consume reservas.
    DECLARE @IDVariante INT, @Cantidad INT, @Precio DECIMAL(10,2);
    DECLARE cur CURSOR LOCAL FOR SELECT IDVariante, Cantidad, PrecioUnitario FROM @Items;
    OPEN cur;
    FETCH NEXT FROM cur INTO @IDVariante, @Cantidad, @Precio;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        UPDATE $(SCHEMA).Variante
        SET Existencia = Existencia - @Cantidad
        WHERE IDVariante = @IDVariante AND Existencia >= @Cantidad;

        IF @@ROWCOUNT = 0
            THROW 50043, 'No hay suficiente existencia para una o más variantes.', 1;

        INSERT INTO $(SCHEMA).DetallePedido (IDPedido, IDVariante, Cantidad, PrecioUnitario)
        VALUES (@IDPedido, @IDVariante, @Cantidad, @Precio);

        DECLARE @ExistenciaNueva INT = (SELECT Existencia FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante);
        INSERT INTO $(SCHEMA).Kardex (IDVariante, TipoMovimiento, Cantidad, ExistenciaNueva, IDUsuario)
        VALUES (@IDVariante, 'SalidaVenta', -@Cantidad, @ExistenciaNueva, @IDUsuario);

        UPDATE $(SCHEMA).ReservaInventario SET Estado = 'Consumida'
        WHERE IDVariante = @IDVariante AND IDCarrito = @IDCarrito AND Estado = 'Activa';

        FETCH NEXT FROM cur INTO @IDVariante, @Cantidad, @Precio;
    END;
    CLOSE cur;
    DEALLOCATE cur;

    IF @IDCupon IS NOT NULL
    BEGIN
        INSERT INTO $(SCHEMA).CuponUso (IDCupon, IDUsuario, IDPedido)
        VALUES (@IDCupon, @IDUsuario, @IDPedido);
        UPDATE $(SCHEMA).Cupon SET TotalUsos = TotalUsos + 1 WHERE IDCupon = @IDCupon;
    END;

    DELETE FROM $(SCHEMA).DetalleCarrito WHERE IDCarrito = @IDCarrito;

    COMMIT;

    SELECT IDPedido, Estado, Subtotal, Descuento, Total, NumeroSeguimiento, FechaCreacion
    FROM $(SCHEMA).Pedido
    WHERE IDPedido = @IDPedido;
END;
GO
