-- ══════════════════════════════════════════════════════════════════════════
-- V010: Vistas y Stored Procedures de Dashboard/Reportes (RF-08)
-- Los reportes solo consideran pedidos no cancelados y descuentan devoluciones.
-- ══════════════════════════════════════════════════════════════════════════

CREATE VIEW $(SCHEMA).VW_Dashboard_VentasPorCategoria
AS
SELECT cat.IDCategoria,
       cat.Nombre AS Categoria,
       COUNT(DISTINCT p.IDPedido) AS Pedidos,
       SUM((dp.Cantidad - dp.CantidadDevuelta) * dp.PrecioUnitario) AS TotalVendido
FROM $(SCHEMA).DetallePedido dp
INNER JOIN $(SCHEMA).Pedido p ON p.IDPedido = dp.IDPedido AND p.Estado <> 'Cancelado'
INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dp.IDVariante
INNER JOIN $(SCHEMA).Producto prod ON prod.IDProducto = v.IDProducto
INNER JOIN $(SCHEMA).Categoria cat ON cat.IDCategoria = prod.IDCategoria
GROUP BY cat.IDCategoria, cat.Nombre;
GO

CREATE VIEW $(SCHEMA).VW_Dashboard_ProductosMasVendidos
AS
SELECT prod.IDProducto,
       prod.Nombre AS Producto,
       SUM(dp.Cantidad - dp.CantidadDevuelta) AS UnidadesVendidas,
       SUM((dp.Cantidad - dp.CantidadDevuelta) * dp.PrecioUnitario) AS TotalVendido
FROM $(SCHEMA).DetallePedido dp
INNER JOIN $(SCHEMA).Pedido p ON p.IDPedido = dp.IDPedido AND p.Estado <> 'Cancelado'
INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dp.IDVariante
INNER JOIN $(SCHEMA).Producto prod ON prod.IDProducto = v.IDProducto
GROUP BY prod.IDProducto, prod.Nombre;
GO

CREATE VIEW $(SCHEMA).VW_Pedidos_Historial
AS
SELECT p.IDPedido,
       p.NumeroSeguimiento,
       p.Estado,
       h.EstadoAnterior,
       h.EstadoNuevo,
       h.Fecha,
       h.IDUsuario,
       u.Nombre AS Usuario
FROM $(SCHEMA).HistorialEstadoPedido h
INNER JOIN $(SCHEMA).Pedido p ON p.IDPedido = h.IDPedido
INNER JOIN $(SCHEMA).Usuario u ON u.IDUsuario = h.IDUsuario;
GO

CREATE PROCEDURE $(SCHEMA).SP_Dashboard_VentasPorPeriodo
    @FechaDesde DATETIME2,
    @FechaHasta DATETIME2,
    @AgruparPor NVARCHAR(10) = 'Dia'
AS
BEGIN
    SET NOCOUNT ON;

    IF @AgruparPor = 'Semana'
    BEGIN
        SELECT CAST(DATEADD(DAY, 1 - DATEPART(WEEKDAY, p.FechaCreacion), CAST(p.FechaCreacion AS DATE)) AS DATE) AS Periodo,
               SUM(p.Total) AS Ventas,
               COUNT(*) AS Pedidos
        FROM $(SCHEMA).Pedido p
        WHERE p.Estado <> 'Cancelado' AND p.FechaCreacion >= @FechaDesde AND p.FechaCreacion <= @FechaHasta
        GROUP BY DATEADD(DAY, 1 - DATEPART(WEEKDAY, p.FechaCreacion), CAST(p.FechaCreacion AS DATE))
        ORDER BY Periodo;
    END
    ELSE IF @AgruparPor = 'Mes'
    BEGIN
        SELECT DATEFROMPARTS(YEAR(p.FechaCreacion), MONTH(p.FechaCreacion), 1) AS Periodo,
               SUM(p.Total) AS Ventas,
               COUNT(*) AS Pedidos
        FROM $(SCHEMA).Pedido p
        WHERE p.Estado <> 'Cancelado' AND p.FechaCreacion >= @FechaDesde AND p.FechaCreacion <= @FechaHasta
        GROUP BY DATEFROMPARTS(YEAR(p.FechaCreacion), MONTH(p.FechaCreacion), 1)
        ORDER BY Periodo;
    END
    ELSE
    BEGIN
        SELECT CAST(p.FechaCreacion AS DATE) AS Periodo,
               SUM(p.Total) AS Ventas,
               COUNT(*) AS Pedidos
        FROM $(SCHEMA).Pedido p
        WHERE p.Estado <> 'Cancelado' AND p.FechaCreacion >= @FechaDesde AND p.FechaCreacion <= @FechaHasta
        GROUP BY CAST(p.FechaCreacion AS DATE)
        ORDER BY Periodo;
    END;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Dashboard_ProductosMasVendidos
    @FechaDesde DATETIME2,
    @FechaHasta DATETIME2,
    @Top        INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Top)
           prod.IDProducto,
           prod.Nombre AS Producto,
           SUM(dp.Cantidad - dp.CantidadDevuelta) AS UnidadesVendidas,
           SUM((dp.Cantidad - dp.CantidadDevuelta) * dp.PrecioUnitario) AS TotalVendido
    FROM $(SCHEMA).DetallePedido dp
    INNER JOIN $(SCHEMA).Pedido p ON p.IDPedido = dp.IDPedido
    INNER JOIN $(SCHEMA).Variante v ON v.IDVariante = dp.IDVariante
    INNER JOIN $(SCHEMA).Producto prod ON prod.IDProducto = v.IDProducto
    WHERE p.Estado <> 'Cancelado' AND p.FechaCreacion >= @FechaDesde AND p.FechaCreacion <= @FechaHasta
    GROUP BY prod.IDProducto, prod.Nombre
    ORDER BY UnidadesVendidas DESC;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Dashboard_Resumen
    @FechaDesde DATETIME2,
    @FechaHasta DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ISNULL(SUM(p.Total), 0) AS TotalVentas,
           COUNT(*) AS TotalPedidos,
           CASE WHEN COUNT(*) > 0 THEN SUM(p.Total) / COUNT(*) ELSE 0 END AS TicketPromedio
    FROM $(SCHEMA).Pedido p
    WHERE p.Estado <> 'Cancelado' AND p.FechaCreacion >= @FechaDesde AND p.FechaCreacion <= @FechaHasta;
END;
GO
