-- ══════════════════════════════════════════════════════════════════════════
-- V013: Asociación de atributos a variantes (RF-02)
-- SPs para agregar, modificar (valor) y quitar atributos de una variante.
-- ══════════════════════════════════════════════════════════════════════════

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_AgregarAtributoVariante
    @IDVariante INT,
    @IDAtributo INT,
    @Valor      NVARCHAR(100),
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Variante WHERE IDVariante = @IDVariante)
        THROW 50015, 'Variante no encontrada.', 1;

    IF NOT EXISTS (SELECT 1 FROM $(SCHEMA).Atributo WHERE IDAtributo = @IDAtributo)
        THROW 50017, 'Atributo no encontrado.', 1;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).VarianteAtributo WHERE IDVariante = @IDVariante AND IDAtributo = @IDAtributo)
        THROW 50019, 'El atributo ya está asociado a la variante.', 1;

    INSERT INTO $(SCHEMA).VarianteAtributo (IDVariante, IDAtributo, Valor)
    VALUES (@IDVariante, @IDAtributo, @Valor);

    DECLARE @Detalle NVARCHAR(500) = CONCAT('Atributo=', @IDAtributo, '; Valor=', @Valor);
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'AgregarAtributo', NULL, @Detalle;

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

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_ModificarAtributoVariante
    @IDVariante INT,
    @IDAtributo INT,
    @Valor      NVARCHAR(100),
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ValorAnterior NVARCHAR(100);
    SELECT @ValorAnterior = Valor
    FROM $(SCHEMA).VarianteAtributo
    WHERE IDVariante = @IDVariante AND IDAtributo = @IDAtributo;

    IF @ValorAnterior IS NULL
        THROW 50023, 'El atributo no está asociado a la variante.', 1;

    UPDATE $(SCHEMA).VarianteAtributo
    SET Valor = @Valor
    WHERE IDVariante = @IDVariante AND IDAtributo = @IDAtributo;

    DECLARE @Detalle NVARCHAR(500) = CONCAT('Atributo=', @IDAtributo, '; Valor=', @Valor);
    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'ModificarAtributo', @ValorAnterior, @Valor;

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

CREATE PROCEDURE $(SCHEMA).SP_Catalogo_QuitarAtributoVariante
    @IDVariante INT,
    @IDAtributo INT,
    @IDUsuario  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ValorAnterior NVARCHAR(100);
    SELECT @ValorAnterior = Valor
    FROM $(SCHEMA).VarianteAtributo
    WHERE IDVariante = @IDVariante AND IDAtributo = @IDAtributo;

    IF @ValorAnterior IS NULL
        THROW 50023, 'El atributo no está asociado a la variante.', 1;

    DELETE FROM $(SCHEMA).VarianteAtributo
    WHERE IDVariante = @IDVariante AND IDAtributo = @IDAtributo;

    EXEC $(SCHEMA).SP_Bitacora_Registrar @IDUsuario, 'Variante', 'QuitarAtributo', @ValorAnterior, NULL;
END;
GO
