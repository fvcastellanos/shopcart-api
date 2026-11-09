-- ══════════════════════════════════════════════════════════════════════════
-- V016: Cancelación de pedidos reflejada en kardex (RF-07)
-- 1) Se agrega el tipo de movimiento 'Cancelacion' al kardex.
-- 2) Al cancelar un pedido se reintegra la existencia y se registra el
--    movimiento en el kardex.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE $(SCHEMA).Kardex DROP CONSTRAINT CHK_Kardex_Tipo;
GO

ALTER TABLE $(SCHEMA).Kardex
    ADD CONSTRAINT CHK_Kardex_Tipo
    CHECK (TipoMovimiento IN ('EntradaCompra', 'SalidaVenta', 'Ajuste', 'Devolucion', 'Cancelacion'));
GO

ALTER PROCEDURE $(SCHEMA).SP_Pedidos_CambiarEstado
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

    -- Cancelación: reintegra existencia y registra el movimiento en kardex.
    IF @EstadoNuevo = 'Cancelado'
    BEGIN
        DECLARE @IDVariante INT, @CantidadReintegrar INT;
        DECLARE cur CURSOR LOCAL FOR
            SELECT dp.IDVariante, dp.Cantidad - dp.CantidadDevuelta
            FROM $(SCHEMA).DetallePedido dp
            WHERE dp.IDPedido = @IDPedido;

        OPEN cur;
        FETCH NEXT FROM cur INTO @IDVariante, @CantidadReintegrar;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF @CantidadReintegrar > 0
            BEGIN
                UPDATE $(SCHEMA).Variante
                SET Existencia = Existencia + @CantidadReintegrar
                WHERE IDVariante = @IDVariante;

                DECLARE @ExistenciaNueva INT = (SELECT Existencia FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante);
                INSERT INTO $(SCHEMA).Kardex (IDVariante, TipoMovimiento, Cantidad, ExistenciaNueva, Motivo, IDUsuario)
                VALUES (@IDVariante, 'Cancelacion', @CantidadReintegrar, @ExistenciaNueva, 'Cancelación de pedido', @IDUsuario);
            END;

            FETCH NEXT FROM cur INTO @IDVariante, @CantidadReintegrar;
        END;
        CLOSE cur;
        DEALLOCATE cur;
    END;

    UPDATE $(SCHEMA).Pedido SET Estado = @EstadoNuevo WHERE IDPedido = @IDPedido;

    INSERT INTO $(SCHEMA).HistorialEstadoPedido (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario)
    VALUES (@IDPedido, @EstadoAnterior, @EstadoNuevo, @IDUsuario);

    COMMIT;

    SELECT IDPedido, Estado FROM $(SCHEMA).Pedido WHERE IDPedido = @IDPedido;
END;
GO
