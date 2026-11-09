-- ══════════════════════════════════════════════════════════════════════════
-- V012: Recurso Atributos (desacople del catálogo)
-- 1) Nueva tabla Atributo (catálogo independiente de variantes).
-- 2) VarianteAtributo pasa a referenciar Atributo por ID (elimina Nombre).
-- 3) SPs CRUD de Atributos + ajuste de los SPs de variantes.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE $(SCHEMA).Atributo (
    IDAtributo    INT          NOT NULL IDENTITY(1,1) CONSTRAINT PK_Atributo PRIMARY KEY,
    Nombre        NVARCHAR(50) NOT NULL CONSTRAINT UQ_Atributo_Nombre UNIQUE,
    Activo        BIT          NOT NULL CONSTRAINT DF_Atributo_Activo DEFAULT 1,
    FechaCreacion DATETIME2    NOT NULL CONSTRAINT DF_Atributo_FechaCreacion DEFAULT SYSUTCDATETIME()
);
GO

-- Migrar los nombres existentes al catálogo de atributos.
INSERT INTO $(SCHEMA).Atributo (Nombre)
SELECT DISTINCT Nombre FROM $(SCHEMA).VarianteAtributo ORDER BY Nombre;
GO

ALTER TABLE $(SCHEMA).VarianteAtributo ADD IDAtributo INT NULL;
GO

UPDATE va SET va.IDAtributo = a.IDAtributo
FROM $(SCHEMA).VarianteAtributo va
INNER JOIN $(SCHEMA).Atributo a ON a.Nombre = va.Nombre;
GO

ALTER TABLE $(SCHEMA).VarianteAtributo ALTER COLUMN IDAtributo INT NOT NULL;
GO

ALTER TABLE $(SCHEMA).VarianteAtributo DROP COLUMN Nombre;
GO

ALTER TABLE $(SCHEMA).VarianteAtributo
    ADD CONSTRAINT FK_VarianteAtributo_Atributo FOREIGN KEY (IDAtributo)
        REFERENCES $(SCHEMA).Atributo (IDAtributo);
GO

ALTER TABLE $(SCHEMA).VarianteAtributo
    ADD CONSTRAINT UQ_VarianteAtributo UNIQUE (IDVariante, IDAtributo);
GO

CREATE INDEX IX_VarianteAtributo_Atributo ON $(SCHEMA).VarianteAtributo (IDAtributo);
GO


-- ── Atributos ───────────────────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Atributos_Listar
    @SoloActivas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDAtributo, Nombre, Activo
    FROM $(SCHEMA).Atributo
    WHERE (@SoloActivas = 0 OR Activo = 1)
    ORDER BY Nombre;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Atributos_Crear
    @Nombre    NVARCHAR(50),
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Atributo WHERE Nombre = @Nombre)
        THROW 50018, 'Ya existe un atributo con ese nombre.', 1;

    INSERT INTO $(SCHEMA).Atributo (Nombre) VALUES (@Nombre);

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Atributo', 'Crear', NULL, @Nombre;

    SELECT IDAtributo, Nombre, Activo
    FROM $(SCHEMA).Atributo
    WHERE IDAtributo = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Atributos_Modificar
    @IDAtributo INT,
    @Nombre     NVARCHAR(50),
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NombreAnterior NVARCHAR(50);
    SELECT @NombreAnterior = Nombre FROM $(SCHEMA).Atributo WHERE IDAtributo = @IDAtributo;
    IF @NombreAnterior IS NULL
        THROW 50017, 'Atributo no encontrado.', 1;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Atributo WHERE Nombre = @Nombre AND IDAtributo <> @IDAtributo)
        THROW 50018, 'Ya existe un atributo con ese nombre.', 1;

    UPDATE $(SCHEMA).Atributo SET Nombre = @Nombre WHERE IDAtributo = @IDAtributo;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Atributo', 'Modificar', @NombreAnterior, @Nombre;

    SELECT IDAtributo, Nombre, Activo
    FROM $(SCHEMA).Atributo
    WHERE IDAtributo = @IDAtributo;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Atributos_Desactivar
    @IDAtributo INT,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Atributo WHERE IDAtributo = @IDAtributo)
        THROW 50017, 'Atributo no encontrado.', 1;

    UPDATE $(SCHEMA).Atributo SET Activo = 0 WHERE IDAtributo = @IDAtributo;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Atributo', 'Desactivar', 'Activo', 'Inactivo';
END;
GO


-- ── Ajuste de SPs de variantes (referencian Atributo por ID) ───────────────
ALTER PROCEDURE $(SCHEMA).SP_Catalogo_ListarVariantes
    @IDProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT v.IDVariante, v.IDProducto, v.SKU, v.Precio, v.Existencia, v.Activo,
           (SELECT va.IDAtributo as idAtributo, a.Nombre as nombre, va.Valor as valor
            FROM $(SCHEMA).VarianteAtributo va
            INNER JOIN $(SCHEMA).Atributo a ON a.IDAtributo = va.IDAtributo
            WHERE va.IDVariante = v.IDVariante
            FOR JSON PATH) AS Atributos
    FROM $(SCHEMA).Variante v
    WHERE v.IDProducto = @IDProducto
    ORDER BY v.IDVariante;
END;
GO

ALTER PROCEDURE $(SCHEMA).SP_Catalogo_ConsultarVariante
    @IDVariante INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT v.IDVariante, v.IDProducto, v.SKU, v.Precio, v.Existencia, v.Activo,
           (SELECT va.IDAtributo as idAtributo, a.Nombre as nombre, va.Valor as valor
            FROM $(SCHEMA).VarianteAtributo va
            INNER JOIN $(SCHEMA).Atributo a ON a.IDAtributo = va.IDAtributo
            WHERE va.IDVariante = v.IDVariante
            FOR JSON PATH) AS Atributos
    FROM $(SCHEMA).Variante v
    WHERE v.IDVariante = @IDVariante;
END;
GO

ALTER PROCEDURE $(SCHEMA).SP_Catalogo_CrearVariante
    @IDProducto INT,
    @SKU        NVARCHAR(50),
    @Precio     DECIMAL(10,2),
    @Existencia INT,
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

    DECLARE @DetalleVariante NVARCHAR(500) = CONCAT('SKU=', @SKU, '; Precio=', @Precio, '; Existencia=', @Existencia);
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'Crear', NULL, @DetalleVariante;

    SELECT IDVariante, IDProducto, SKU, Precio, Existencia, Activo
    FROM $(SCHEMA).Variante
    WHERE IDVariante = @IDVariante;
END;
GO
