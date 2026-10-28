-- ══════════════════════════════════════════════════════════════════════════
-- V007: Stored Procedures y función de Cupones (RF-05)
-- ══════════════════════════════════════════════════════════════════════════

CREATE FUNCTION $(SCHEMA).FU_Cupones_CalculoDescuento
(
    @Tipo     NVARCHAR(20),
    @Valor    DECIMAL(10,2),
    @Subtotal DECIMAL(12,2)
)
RETURNS TABLE
AS
RETURN
(
    SELECT CASE
        WHEN @Tipo = 'Porcentaje' THEN ROUND(@Subtotal * @Valor / 100.0, 2)
        WHEN @Tipo = 'MontoFijo'  THEN CASE WHEN @Valor > @Subtotal THEN @Subtotal ELSE @Valor END
        ELSE 0
    END AS Descuento
);
GO

CREATE PROCEDURE $(SCHEMA).SP_Cupones_Listar
    @Busqueda     NVARCHAR(100) = NULL,
    @Pagina       INT = 1,
    @TamanoPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 10;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;
    DECLARE @Patron NVARCHAR(102) = NULL;
    IF @Busqueda IS NOT NULL SET @Patron = CONCAT('%', @Busqueda, '%');

    SELECT c.IDCupon, c.Codigo, c.Tipo, c.Valor, c.MontoMinimo, c.FechaInicio, c.FechaFin,
           c.LimiteTotalUsos, c.LimiteUsoPorCliente, c.TotalUsos, c.IDCategoria,
           cat.Nombre AS Categoria, c.Activo,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Cupon c
    LEFT JOIN $(SCHEMA).Categoria cat ON cat.IDCategoria = c.IDCategoria
    WHERE (@Patron IS NULL OR c.Codigo LIKE @Patron)
    ORDER BY c.IDCupon
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Cupones_ConsultarPorCodigo
    @Codigo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT c.IDCupon, c.Codigo, c.Tipo, c.Valor, c.MontoMinimo, c.FechaInicio, c.FechaFin,
           c.LimiteTotalUsos, c.LimiteUsoPorCliente, c.TotalUsos, c.IDCategoria,
           cat.Nombre AS Categoria, c.Activo
    FROM $(SCHEMA).Cupon c
    LEFT JOIN $(SCHEMA).Categoria cat ON cat.IDCategoria = c.IDCategoria
    WHERE c.Codigo = @Codigo;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Cupones_Crear
    @Codigo              NVARCHAR(50),
    @Tipo                NVARCHAR(20),
    @Valor               DECIMAL(10,2),
    @MontoMinimo         DECIMAL(10,2),
    @FechaInicio         DATETIME2,
    @FechaFin            DATETIME2,
    @LimiteTotalUsos     INT = NULL,
    @LimiteUsoPorCliente INT = NULL,
    @IDCategoria         INT = NULL,
    @IDUsuario           INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Cupon WHERE Codigo = @Codigo)
        THROW 50050, 'Ya existe un cupón con ese código.', 1;

    IF @FechaFin <= @FechaInicio
        THROW 50051, 'La fecha fin debe ser posterior a la fecha inicio.', 1;

    INSERT INTO $(SCHEMA).Cupon
        (Codigo, Tipo, Valor, MontoMinimo, FechaInicio, FechaFin, LimiteTotalUsos, LimiteUsoPorCliente, IDCategoria)
    VALUES
        (@Codigo, @Tipo, @Valor, @MontoMinimo, @FechaInicio, @FechaFin, @LimiteTotalUsos, @LimiteUsoPorCliente, @IDCategoria);

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Cupon', 'Crear', NULL, @Codigo;

    SELECT IDCupon, Codigo, Tipo, Valor, MontoMinimo, FechaInicio, FechaFin,
           LimiteTotalUsos, LimiteUsoPorCliente, TotalUsos, IDCategoria, Activo
    FROM $(SCHEMA).Cupon
    WHERE IDCupon = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Cupones_Modificar
    @IDCupon             INT,
    @Tipo                NVARCHAR(20),
    @Valor               DECIMAL(10,2),
    @MontoMinimo         DECIMAL(10,2),
    @FechaInicio         DATETIME2,
    @FechaFin            DATETIME2,
    @LimiteTotalUsos     INT = NULL,
    @LimiteUsoPorCliente INT = NULL,
    @IDCategoria         INT = NULL,
    @IDUsuario           INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Cupon WHERE IDCupon = @IDCupon)
        THROW 50052, 'Cupón no encontrado.', 1;

    IF @FechaFin <= @FechaInicio
        THROW 50051, 'La fecha fin debe ser posterior a la fecha inicio.', 1;

    UPDATE $(SCHEMA).Cupon
    SET Tipo = @Tipo, Valor = @Valor, MontoMinimo = @MontoMinimo,
        FechaInicio = @FechaInicio, FechaFin = @FechaFin,
        LimiteTotalUsos = @LimiteTotalUsos, LimiteUsoPorCliente = @LimiteUsoPorCliente,
        IDCategoria = @IDCategoria
    WHERE IDCupon = @IDCupon;

    DECLARE @Detalle NVARCHAR(20) = CAST(@IDCupon AS NVARCHAR(20));
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Cupon', 'Modificar', NULL, @Detalle;

    SELECT IDCupon, Codigo, Tipo, Valor, MontoMinimo, FechaInicio, FechaFin,
           LimiteTotalUsos, LimiteUsoPorCliente, TotalUsos, IDCategoria, Activo
    FROM $(SCHEMA).Cupon
    WHERE IDCupon = @IDCupon;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Cupones_Desactivar
    @IDCupon   INT,
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Cupon WHERE IDCupon = @IDCupon)
        THROW 50052, 'Cupón no encontrado.', 1;

    UPDATE $(SCHEMA).Cupon SET Activo = 0 WHERE IDCupon = @IDCupon;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Cupon', 'Desactivar', 'Activo', 'Inactivo';
END;
GO
