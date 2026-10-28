-- ══════════════════════════════════════════════════════════════════════════
-- V009: Stored Procedures de Pedidos (RF-07)
-- Ciclo de vida, devoluciones y consultas.
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Pedidos_Consultar
    @IDPedido INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.IDPedido, p.IDUsuario, u.Correo, p.IDDireccion, p.IDCupon, c.Codigo AS CodigoCupon,
           p.Estado, p.Subtotal, p.Descuento, p.Total, p.NumeroSeguimiento, p.FechaCreacion
    FROM $(SCHEMA).Pedido p
    INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = p.IDUsuario
    LEFT JOIN $(SCHEMA).Cupon c ON c.IDCupon = p.IDCupon
    WHERE p.IDPedido = @IDPedido;

    SELECT dp.IDDetallePedido, dp.IDVariante, dp.Cantidad, dp.PrecioUnitario,
           dp.DescuentoLinea, dp.CantidadDevuelta, v.SKU, prod.Nombre AS Producto
    FROM $(SCHEMA).DetallePedido dp
    INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dp.IDVariante
    INNER JOIN $(SCHEMA).Producto prod ON prod.IDProducto = v.IDProducto
    WHERE dp.IDPedido = @IDPedido;

    SELECT h.IDHistorialEstadoPedido, h.EstadoAnterior, h.EstadoNuevo, h.IDUsuario,
           u.Nombre AS Usuario, h.Fecha
    FROM $(SCHEMA).HistorialEstadoPedido h
    INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = h.IDUsuario
    WHERE h.IDPedido = @IDPedido
    ORDER BY h.Fecha;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Pedidos_Listar
    @Estado       NVARCHAR(20) = NULL,
    @IDUsuario    INT = NULL,
    @FechaDesde   DATETIME2 = NULL,
    @FechaHasta   DATETIME2 = NULL,
    @Pagina       INT = 1,
    @TamanoPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 10;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT p.IDPedido, p.IDUsuario, u.Correo, p.Estado, p.Subtotal, p.Descuento, p.Total,
           p.NumeroSeguimiento, p.FechaCreacion,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Pedido p
    INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = p.IDUsuario
    WHERE (@Estado IS NULL OR p.Estado = @Estado)
      AND (@IDUsuario IS NULL OR p.IDUsuario = @IDUsuario)
      AND (@FechaDesde IS NULL OR p.FechaCreacion >= @FechaDesde)
      AND (@FechaHasta IS NULL OR p.FechaCreacion <= @FechaHasta)
    ORDER BY p.IDPedido DESC
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Pedidos_ListarPorCliente
    @IDUsuario    INT,
    @Pagina       INT = 1,
    @TamanoPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 10;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT p.IDPedido, p.Estado, p.Subtotal, p.Descuento, p.Total,
           p.NumeroSeguimiento, p.FechaCreacion,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Pedido p
    WHERE p.IDUsuario = @IDUsuario
    ORDER BY p.IDPedido DESC
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Pedidos_CambiarEstado
    @IDPedido   INT,
    @EstadoNuevo NVARCHAR(20),
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    DECLARE @EstadoAnterior NVARCHAR(20);
    SELECT @EstadoAnterior = Estado FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido;

    IF @EstadoAnterior IS NULL
        THROW 50070, 'Pedido no encontrado.', 1;

    -- Reglas de transición permitidas.
    DECLARE @TransicionValida BIT = 0;
    SET @TransicionValida = CASE
        WHEN @EstadoAnterior = 'Confirmado'     AND @EstadoNuevo IN ('EnPreparacion', 'Cancelado') THEN 1
        WHEN @EstadoAnterior = 'EnPreparacion'  AND @EstadoNuevo IN ('Despachado', 'Cancelado')     THEN 1
        WHEN @EstadoAnterior = 'Despachado'     AND @EstadoNuevo IN ('Entregado')                   THEN 1
        ELSE 0
    END;

    IF @TransicionValida = 0
        THROW 50071, 'Transición de estado no permitida.', 1;

    UPDATE $(SCHEMA).Pedido SET Estado = @EstadoNuevo WHERE IDPedido = @IDPedido;

    INSERT INTO $(SCHEMA).HistorialEstadoPedido (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario)
    VALUES (@IDPedido, @EstadoAnterior, @EstadoNuevo, @IDUsuario);

    COMMIT;

    SELECT IDPedido, Estado FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Pedidos_RegistrarDevolucion
    @IDPedido  INT,
    @Lineas    NVARCHAR(MAX),   -- JSON: [{"IDDetallePedido":1,"Cantidad":1}]
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido)
        THROW 50070, 'Pedido no encontrado.', 1;

    DECLARE @Estado NVARCHAR(20) = (SELECT Estado FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido);
    IF @Estado IN ('Cancelado')
        THROW 50072, 'No se puede devolver un pedido cancelado.', 1;

    DECLARE @LineasDevolucion TABLE (IDDetallePedido INT, Cantidad INT);
    INSERT INTO @LineasDevolucion (IDDetallePedido, Cantidad)
    SELECT IDDetallePedido, Cantidad
    FROM OPENJSON(@Lineas)
    WITH (IDDetallePedido INT '$.idDetallePedido', Cantidad INT '$.cantidad');

    DECLARE @IDDetalle INT, @Cantidad INT, @IDVariante INT;
    DECLARE cur CURSOR LOCAL FOR
        SELECT ld.IDDetallePedido, ld.Cantidad FROM @LineasDevolucion ld;
    OPEN cur;
    FETCH NEXT FROM cur INTO @IDDetalle, @Cantidad;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @IDVariante = dp.IDVariante
        FROM $(SCHEMA).DetallePedido dp
        WHERE dp.IDDetallePedido = @IDDetalle AND dp.IDPedido = @IDPedido;

        IF @IDVariante IS NULL
            THROW 50073, 'Línea de pedido no encontrada.', 1;

        -- No devolver más de lo vendido (considerando devoluciones previas).
        IF EXISTS (
            SELECT 1 FROM $(SCHEMA).DetallePedido dp
            WHERE dp.IDDetallePedido = @IDDetalle
              AND dp.CantidadDevuelta + @Cantidad > dp.Cantidad)
            THROW 50074, 'No se puede devolver más cantidad de la vendida.', 1;

        UPDATE $(SCHEMA).DetallePedido
        SET CantidadDevuelta = CantidadDevuelta + @Cantidad
        WHERE IDDetallePedido = @IDDetalle;

        -- Reintegra existencia (kardex Devolucion).
        UPDATE $(SCHEMA).Variante SET Existencia = Existencia + @Cantidad WHERE IDVariante = @IDVariante;
        DECLARE @ExistenciaNueva INT = (SELECT Existencia FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante);
        INSERT INTO $(SCHEMA).Kardex (IDVariante, TipoMovimiento, Cantidad, ExistenciaNueva, Motivo, IDUsuario)
        VALUES (@IDVariante, 'Devolucion', @Cantidad, @ExistenciaNueva, 'Devolución de pedido', @IDUsuario);

        FETCH NEXT FROM cur INTO @IDDetalle, @Cantidad;
    END;
    CLOSE cur;
    DEALLOCATE cur;

    COMMIT;

    SELECT IDPedido, Estado FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido;
END;
GO
