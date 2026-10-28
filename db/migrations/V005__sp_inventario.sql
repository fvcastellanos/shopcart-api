-- ══════════════════════════════════════════════════════════════════════════
-- V005: Stored Procedures de Inventario (RF-03)
-- Existencia, kardex (entradas, ajustes) y consulta de movimientos.
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Inventario_ConsultarExistencia
    @IDVariante INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Reservada INT;
    SELECT @Reservada = ISNULL(SUM(Cantidad), 0)
    FROM $(SCHEMA).ReservaInventario
    WHERE IDVariante = @IDVariante AND Estado = 'Activa';

    SELECT v.IDVariante,
           v.SKU,
           v.Existencia                          AS ExistenciaFisica,
           @Reservada                            AS ExistenciaReservada,
           v.Existencia - @Reservada             AS ExistenciaDisponible
    FROM $(SCHEMA).Variante v
    WHERE v.IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Inventario_RegistrarEntrada
    @IDVariante INT,
    @Cantidad   INT,
    @Motivo     NVARCHAR(255) = NULL,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Cantidad <= 0
        THROW 50020, 'La cantidad debe ser mayor que cero.', 1;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante)
        THROW 50015, 'Variante no encontrada.', 1;

    UPDATE $(SCHEMA).Variante
    SET Existencia = Existencia + @Cantidad
    WHERE IDVariante = @IDVariante;

    DECLARE @ExistenciaNueva INT = (SELECT Existencia FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante);

    INSERT INTO $(SCHEMA).Kardex (IDVariante, TipoMovimiento, Cantidad, ExistenciaNueva, Motivo, IDUsuario)
    VALUES (@IDVariante, 'EntradaCompra', @Cantidad, @ExistenciaNueva, @Motivo, @IDUsuario);

    SELECT @ExistenciaNueva AS ExistenciaNueva;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Inventario_RegistrarAjuste
    @IDVariante INT,
    @Cantidad   INT,
    @Motivo     NVARCHAR(255),
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''
        THROW 50021, 'El ajuste exige un motivo.', 1;

    UPDATE $(SCHEMA).Variante
    SET Existencia = Existencia + @Cantidad
    WHERE IDVariante = @IDVariante
      AND Existencia + @Cantidad >= 0;

    IF @@ROWCOUNT = 0
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante)
            THROW 50015, 'Variante no encontrada.', 1;
        THROW 50022, 'El ajuste no puede dejar la existencia en negativo.', 1;
    END;

    DECLARE @ExistenciaNueva INT = (SELECT Existencia FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante);

    INSERT INTO $(SCHEMA).Kardex (IDVariante, TipoMovimiento, Cantidad, ExistenciaNueva, Motivo, IDUsuario)
    VALUES (@IDVariante, 'Ajuste', @Cantidad, @ExistenciaNueva, @Motivo, @IDUsuario);

    SELECT @ExistenciaNueva AS ExistenciaNueva;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Inventario_ListarKardex
    @IDVariante   INT,
    @Pagina       INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 20;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT k.IDKardex,
           k.IDVariante,
           k.TipoMovimiento,
           k.Cantidad,
           k.ExistenciaNueva,
           k.Motivo,
           k.IDUsuario,
           u.Nombre AS Usuario,
           k.FechaRegistro,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Kardex k
    INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = k.IDUsuario
    WHERE k.IDVariante = @IDVariante
    ORDER BY k.IDKardex DESC
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO
