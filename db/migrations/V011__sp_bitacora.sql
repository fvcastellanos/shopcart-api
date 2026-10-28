-- ══════════════════════════════════════════════════════════════════════════
-- V011: Stored Procedures de Bitácora (RF-09)
-- Consulta de auditoría (solo lectura; la escritura está en SP_Bitacora_Registrar).
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Bitacora_Listar
    @Entidad      NVARCHAR(100) = NULL,
    @IDUsuario    INT = NULL,
    @FechaDesde   DATETIME2 = NULL,
    @FechaHasta   DATETIME2 = NULL,
    @Pagina       INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 20;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT b.IDBitacora,
           b.IDUsuario,
           u.Nombre AS Usuario,
           b.Entidad,
           b.Accion,
           b.ValorAnterior,
           b.ValorNuevo,
           b.Fecha,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Bitacora b
    INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = b.IDUsuario
    WHERE (@Entidad IS NULL OR b.Entidad = @Entidad)
      AND (@IDUsuario IS NULL OR b.IDUsuario = @IDUsuario)
      AND (@FechaDesde IS NULL OR b.Fecha >= @FechaDesde)
      AND (@FechaHasta IS NULL OR b.Fecha <= @FechaHasta)
    ORDER BY b.IDBitacora DESC
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO
