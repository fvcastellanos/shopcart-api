-- ══════════════════════════════════════════════════════════════════════════
-- V004: Stored Procedures de Catálogo (RF-02)
-- Categorías, productos, variantes (con atributos) + bitácora de auditoría.
-- Nomenclatura: SP_Modulo_Proceso. Parámetros tipados. SQL dinámico solo con
-- sp_executesql y columnas de ordenamiento en whitelist.
-- ══════════════════════════════════════════════════════════════════════════


-- ── Bitácora (RF-09) — helper reutilizable por todos los módulos ─────────────
CREATE PROCEDURE $(SCHEMA).SP_Bitacora_Registrar
    @IDUsuario     INT,
    @Entidad       NVARCHAR(100),
    @Accion        NVARCHAR(20),
    @ValorAnterior NVARCHAR(MAX) = NULL,
    @ValorNuevo    NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO $(SCHEMA).Bitacora (IDUsuario, Entidad, Accion, ValorAnterior, ValorNuevo)
    VALUES (@IDUsuario, @Entidad, @Accion, @ValorAnterior, @ValorNuevo);
END;
GO


-- ── Categorías ───────────────────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ListarCategorias
    @SoloActivas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDCategoria, Nombre, Activo
    FROM $(SCHEMA).Categoria
    WHERE (@SoloActivas = 0 OR Activo = 1)
    ORDER BY Nombre;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ConsultarCategoria
    @IDCategoria INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDCategoria, Nombre, Activo
    FROM $(SCHEMA).Categoria
    WHERE IDCategoria = @IDCategoria;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_CrearCategoria
    @Nombre    NVARCHAR(100),
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Categoria WHERE Nombre = @Nombre)
        THROW 50011, 'Ya existe una categoría con ese nombre.', 1;

    INSERT INTO $(SCHEMA).Categoria (Nombre) VALUES (@Nombre);

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Categoria', 'Crear', NULL, @Nombre;

    SELECT IDCategoria, Nombre, Activo
    FROM $(SCHEMA).Categoria
    WHERE IDCategoria = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ModificarCategoria
    @IDCategoria INT,
    @Nombre      NVARCHAR(100),
    @IDUsuario   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NombreAnterior NVARCHAR(100);
    SELECT @NombreAnterior = Nombre FROM $(SCHEMA).Categoria WHERE IDCategoria = @IDCategoria;
    IF @NombreAnterior IS NULL
        THROW 50014, 'Categoría no encontrada.', 1;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Categoria WHERE Nombre = @Nombre AND IDCategoria <> @IDCategoria)
        THROW 50011, 'Ya existe una categoría con ese nombre.', 1;

    UPDATE $(SCHEMA).Categoria SET Nombre = @Nombre WHERE IDCategoria = @IDCategoria;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Categoria', 'Modificar', @NombreAnterior, @Nombre;

    SELECT IDCategoria, Nombre, Activo
    FROM $(SCHEMA).Categoria
    WHERE IDCategoria = @IDCategoria;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_DesactivarCategoria
    @IDCategoria INT,
    @IDUsuario   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Categoria WHERE IDCategoria = @IDCategoria)
        THROW 50014, 'Categoría no encontrada.', 1;

    UPDATE $(SCHEMA).Categoria SET Activo = 0 WHERE IDCategoria = @IDCategoria;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Categoria', 'Desactivar', 'Activo', 'Inactivo';
END;
GO


-- ── Productos ────────────────────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ListarProductos
    @Busqueda        NVARCHAR(200)  = NULL,
    @IDCategoria     INT            = NULL,
    @PrecioMin       DECIMAL(10,2)  = NULL,
    @PrecioMax       DECIMAL(10,2)  = NULL,
    @SoloDisponibles BIT            = 0,
    @OrdenarPor      NVARCHAR(30)   = 'Nombre',
    @Direccion       NVARCHAR(4)    = 'ASC',
    @Pagina          INT            = 1,
    @TamanoPagina    INT            = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 10;
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    DECLARE @Patron NVARCHAR(202) = NULL;
    IF @Busqueda IS NOT NULL SET @Patron = CONCAT('%', @Busqueda, '%');

    -- Whitelist de ordenamiento (evita SQL injection).
    DECLARE @SortColumn NVARCHAR(50);
    SET @SortColumn = CASE @OrdenarPor
        WHEN 'Precio'    THEN 'PrecioDesde'
        WHEN 'Recientes' THEN 'p.FechaCreacion'
        ELSE 'p.Nombre'
    END;
    DECLARE @SortDir NVARCHAR(4) = CASE WHEN @Direccion = 'DESC' THEN 'DESC' ELSE 'ASC' END;

    DECLARE @SQL NVARCHAR(MAX) = N'
    SELECT p.IDProducto, p.Nombre, p.Descripcion, p.IDCategoria, c.Nombre AS Categoria,
           MIN(v.Precio)     AS PrecioDesde,
           MAX(v.Precio)     AS PrecioHasta,
           SUM(v.Existencia) AS ExistenciaTotal,
           p.Activo, p.FechaCreacion,
           COUNT(*) OVER()   AS TotalRegistros
    FROM $(SCHEMA).Producto p
    INNER JOIN $(SCHEMA).Categoria c ON c.IDCategoria = p.IDCategoria
    LEFT JOIN $(SCHEMA).Variante v ON v.IDProducto = p.IDProducto AND v.Activo = 1
    WHERE p.Activo = 1
      AND (@Patron IS NULL
           OR p.Nombre LIKE @Patron
           OR p.Descripcion LIKE @Patron
           OR EXISTS (SELECT 1 FROM $(SCHEMA).Variante vv WHERE vv.IDProducto = p.IDProducto AND vv.SKU LIKE @Patron))
      AND (@IDCategoria IS NULL OR p.IDCategoria = @IDCategoria)
      AND (@PrecioMin IS NULL OR EXISTS (SELECT 1 FROM $(SCHEMA).Variante vp WHERE vp.IDProducto = p.IDProducto AND vp.Activo = 1 AND vp.Precio >= @PrecioMin))
      AND (@PrecioMax IS NULL OR EXISTS (SELECT 1 FROM $(SCHEMA).Variante vp WHERE vp.IDProducto = p.IDProducto AND vp.Activo = 1 AND vp.Precio <= @PrecioMax))
      AND (@SoloDisponibles = 0 OR EXISTS (SELECT 1 FROM $(SCHEMA).Variante vd WHERE vd.IDProducto = p.IDProducto AND vd.Activo = 1 AND vd.Existencia > 0))
    GROUP BY p.IDProducto, p.Nombre, p.Descripcion, p.IDCategoria, c.Nombre, p.Activo, p.FechaCreacion
    ORDER BY ' + @SortColumn + ' ' + @SortDir + N', p.IDProducto
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;';

    EXEC sp_executesql @SQL,
        N'@Patron NVARCHAR(202), @IDCategoria INT, @PrecioMin DECIMAL(10,2), @PrecioMax DECIMAL(10,2), @SoloDisponibles BIT, @Offset INT, @TamanoPagina INT',
        @Patron, @IDCategoria, @PrecioMin, @PrecioMax, @SoloDisponibles, @Offset, @TamanoPagina;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ConsultarProducto
    @IDProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.IDProducto, p.Nombre, p.Descripcion, p.IDCategoria, c.Nombre AS Categoria, p.Activo, p.FechaCreacion
    FROM $(SCHEMA).Producto p
    INNER JOIN $(SCHEMA).Categoria c ON c.IDCategoria = p.IDCategoria
    WHERE p.IDProducto = @IDProducto;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_CrearProducto
    @Nombre      NVARCHAR(200),
    @Descripcion NVARCHAR(MAX) = NULL,
    @IDCategoria INT,
    @IDUsuario   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Categoria WHERE IDCategoria = @IDCategoria)
        THROW 50014, 'Categoría no encontrada.', 1;

    INSERT INTO $(SCHEMA).Producto (Nombre, Descripcion, IDCategoria)
    VALUES (@Nombre, @Descripcion, @IDCategoria);

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Producto', 'Crear', NULL, @Nombre;

    SELECT p.IDProducto, p.Nombre, p.Descripcion, p.IDCategoria, c.Nombre AS Categoria, p.Activo
    FROM $(SCHEMA).Producto p
    INNER JOIN $(SCHEMA).Categoria c ON c.IDCategoria = p.IDCategoria
    WHERE p.IDProducto = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ModificarProducto
    @IDProducto  INT,
    @Nombre      NVARCHAR(200),
    @Descripcion NVARCHAR(MAX) = NULL,
    @IDCategoria INT,
    @IDUsuario   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NombreAnterior NVARCHAR(200);
    SELECT @NombreAnterior = Nombre FROM $(SCHEMA).Producto WHERE IDProducto = @IDProducto;
    IF @NombreAnterior IS NULL
        THROW 50016, 'Producto no encontrado.', 1;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Categoria WHERE IDCategoria = @IDCategoria)
        THROW 50014, 'Categoría no encontrada.', 1;

    UPDATE $(SCHEMA).Producto
    SET Nombre = @Nombre, Descripcion = @Descripcion, IDCategoria = @IDCategoria
    WHERE IDProducto = @IDProducto;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Producto', 'Modificar', @NombreAnterior, @Nombre;

    SELECT p.IDProducto, p.Nombre, p.Descripcion, p.IDCategoria, c.Nombre AS Categoria, p.Activo
    FROM $(SCHEMA).Producto p
    INNER JOIN $(SCHEMA).Categoria c ON c.IDCategoria = p.IDCategoria
    WHERE p.IDProducto = @IDProducto;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_DesactivarProducto
    @IDProducto INT,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Producto WHERE IDProducto = @IDProducto)
        THROW 50016, 'Producto no encontrado.', 1;

    UPDATE $(SCHEMA).Producto SET Activo = 0 WHERE IDProducto = @IDProducto;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Producto', 'Desactivar', 'Activo', 'Inactivo';
END;
GO


-- ── Variantes ────────────────────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ListarVariantes
    @IDProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT v.IDVariante, v.IDProducto, v.SKU, v.Precio, v.Existencia, v.Activo,
           (SELECT va.Nombre, va.Valor
            FROM $(SCHEMA).VarianteAtributo va
            WHERE va.IDVariante = v.IDVariante
            FOR JSON PATH) AS Atributos
    FROM $(SCHEMA).Variante v
    WHERE v.IDProducto = @IDProducto
    ORDER BY v.IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ConsultarVariante
    @IDVariante INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT v.IDVariante, v.IDProducto, v.SKU, v.Precio, v.Existencia, v.Activo,
           (SELECT va.Nombre, va.Valor
            FROM $(SCHEMA).VarianteAtributo va
            WHERE va.IDVariante = v.IDVariante
            FOR JSON PATH) AS Atributos
    FROM $(SCHEMA).Variante v
    WHERE v.IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_CrearVariante
    @IDProducto INT,
    @SKU        NVARCHAR(50),
    @Precio     DECIMAL(10,2),
    @Existencia INT,
    @Atributos  NVARCHAR(MAX) = NULL,  -- JSON: [{"Nombre":"Talla","Valor":"M"}]
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Producto WHERE IDProducto = @IDProducto)
        THROW 50013, 'Producto no encontrado.', 1;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Variante WHERE SKU = @SKU)
        THROW 50012, 'El SKU ya existe.', 1;

    INSERT INTO $(SCHEMA).Variante (IDProducto, SKU, Precio, Existencia)
    VALUES (@IDProducto, @SKU, @Precio, @Existencia);

    DECLARE @IDVariante INT = SCOPE_IDENTITY();

    IF @Atributos IS NOT NULL
    BEGIN
        INSERT INTO $(SCHEMA).VarianteAtributo (IDVariante, Nombre, Valor)
        SELECT @IDVariante, Nombre, Valor
        FROM OPENJSON(@Atributos)
        WITH (Nombre NVARCHAR(50) '$.nombre', Valor NVARCHAR(100) '$.valor');
    END;

    DECLARE @DetalleVariante NVARCHAR(500) = CONCAT('SKU=', @SKU, '; Precio=', @Precio, '; Existencia=', @Existencia);
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'Crear', NULL, @DetalleVariante;

    SELECT IDVariante, IDProducto, SKU, Precio, Existencia, Activo
    FROM $(SCHEMA).Variante
    WHERE IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ModificarVariante
    @IDVariante INT,
    @Precio     DECIMAL(10,2),
    @Existencia INT,
    @Activo     BIT,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @PrecioAnterior DECIMAL(10,2), @ExistenciaAnterior INT;
    SELECT @PrecioAnterior = Precio, @ExistenciaAnterior = Existencia
    FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante;

    IF @PrecioAnterior IS NULL
        THROW 50015, 'Variante no encontrada.', 1;

    UPDATE $(SCHEMA).Variante
    SET Precio = @Precio, Existencia = @Existencia, Activo = @Activo
    WHERE IDVariante = @IDVariante;

    DECLARE @ValorAnterior NVARCHAR(500) = CONCAT('Precio=', @PrecioAnterior, '; Existencia=', @ExistenciaAnterior);
    DECLARE @ValorNuevo    NVARCHAR(500) = CONCAT('Precio=', @Precio, '; Existencia=', @Existencia);
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'Modificar', @ValorAnterior, @ValorNuevo;

    SELECT IDVariante, IDProducto, SKU, Precio, Existencia, Activo
    FROM $(SCHEMA).Variante
    WHERE IDVariante = @IDVariante;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_DesactivarVariante
    @IDVariante INT,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante)
        THROW 50015, 'Variante no encontrada.', 1;

    UPDATE $(SCHEMA).Variante SET Activo = 0 WHERE IDVariante = @IDVariante;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'Desactivar', 'Activo', 'Inactivo';
END;
GO
