-- ══════════════════════════════════════════════════════════════════════════
-- V015: Devoluciones solo para pedidos Entregado (RF-07)
-- Restringe SP_Pedidos_RegistrarDevolucion: únicamente se permite devolver
-- cuando el pedido está en estado 'Entregado'.
-- ══════════════════════════════════════════════════════════════════════════

ALTER PROCEDURE $(SCHEMA).SP_Pedidos_RegistrarDevolucion
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
    IF @Estado <> 'Entregado'
        THROW 50072, 'Solo se puede devolver un pedido entregado.', 1;

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
