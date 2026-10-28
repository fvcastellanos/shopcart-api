-- ══════════════════════════════════════════════════════════════════════════
-- V003: Stored Procedures de Autenticación (RF-01)
-- Nomenclatura: SP_Modulo_Proceso. Parámetros tipados, sin SQL dinámico.
-- ══════════════════════════════════════════════════════════════════════════


-- ── Usuarios ─────────────────────────────────────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_Usuarios_ConsultarPorCorreo
    @Correo NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT u.IDUsuario,
           u.Correo,
           u.PasswordHash,
           u.Nombre,
           u.IDRol,
           r.Nombre AS Rol,
           u.Activo,
           u.FechaCreacion
    FROM $(SCHEMA).Usuario u
    INNER JOIN $(SCHEMA).Rol r ON r.IDRol = u.IDRol
    WHERE u.Correo = @Correo;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Usuarios_ConsultarPorID
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT u.IDUsuario,
           u.Correo,
           u.PasswordHash,
           u.Nombre,
           u.IDRol,
           r.Nombre AS Rol,
           u.Activo,
           u.FechaCreacion
    FROM $(SCHEMA).Usuario u
    INNER JOIN $(SCHEMA).Rol r ON r.IDRol = u.IDRol
    WHERE u.IDUsuario = @IDUsuario;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Usuarios_CrearCliente
    @Correo       NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Nombre       NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM $(SCHEMA).Usuario WHERE Correo = @Correo)
    BEGIN
        THROW 50001, 'El correo ya está registrado.', 1;
    END;

    DECLARE @IDRolCliente INT;
    SELECT @IDRolCliente = IDRol FROM $(SCHEMA).Rol WHERE Nombre = 'Cliente';

    IF @IDRolCliente IS NULL
    BEGIN
        THROW 50003, 'El rol Cliente no existe.', 1;
    END;

    INSERT INTO $(SCHEMA).Usuario (Correo, PasswordHash, Nombre, IDRol)
    VALUES (@Correo, @PasswordHash, @Nombre, @IDRolCliente);

    SELECT u.IDUsuario,
           u.Correo,
           u.Nombre,
           u.IDRol,
           r.Nombre AS Rol,
           u.Activo
    FROM $(SCHEMA).Usuario u
    INNER JOIN $(SCHEMA).Rol r ON r.IDRol = u.IDRol
    WHERE u.IDUsuario = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Usuarios_CambiarPassword
    @IDUsuario        INT,
    @PasswordHashNuevo NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE $(SCHEMA).Usuario
    SET PasswordHash = @PasswordHashNuevo
    WHERE IDUsuario = @IDUsuario;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50002, 'Usuario no encontrado.', 1;
    END;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Usuarios_Desactivar
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE $(SCHEMA).Usuario
    SET Activo = 0
    WHERE IDUsuario = @IDUsuario;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50002, 'Usuario no encontrado.', 1;
    END;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_Usuarios_Listar
    @Busqueda     NVARCHAR(255) = NULL,
    @Pagina       INT           = 1,
    @TamanoPagina INT           = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pagina < 1 SET @Pagina = 1;
    IF @TamanoPagina < 1 SET @TamanoPagina = 10;

    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT u.IDUsuario,
           u.Correo,
           u.Nombre,
           u.IDRol,
           r.Nombre AS Rol,
           u.Activo,
           u.FechaCreacion,
           COUNT(*) OVER() AS TotalRegistros
    FROM $(SCHEMA).Usuario u
    INNER JOIN $(SCHEMA).Rol r ON r.IDRol = u.IDRol
    WHERE (@Busqueda IS NULL
           OR u.Correo LIKE CONCAT('%', @Busqueda, '%')
           OR u.Nombre  LIKE CONCAT('%', @Busqueda, '%'))
    ORDER BY u.IDUsuario
    OFFSET @Offset ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO


-- ── Sesiones (refresh tokens con rotación) ───────────────────────────────────
CREATE PROCEDURE $(SCHEMA).SP_TokenSesion_Crear
    @IDUsuario        INT,
    @RefreshTokenHash NVARCHAR(255),
    @FechaExpiracion  DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO $(SCHEMA).TokenSesion (IDUsuario, RefreshTokenHash, FechaExpiracion)
    VALUES (@IDUsuario, @RefreshTokenHash, @FechaExpiracion);

    SELECT SCOPE_IDENTITY() AS IDTokenSesion;
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_TokenSesion_ConsultarActivo
    @RefreshTokenHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IDTokenSesion,
           IDUsuario,
           Revocado,
           FechaExpiracion
    FROM $(SCHEMA).TokenSesion
    WHERE RefreshTokenHash = @RefreshTokenHash
      AND Revocado = 0
      AND FechaExpiracion > SYSUTCDATETIME();
END;
GO

CREATE PROCEDURE $(SCHEMA).SP_TokenSesion_Revocar
    @RefreshTokenHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE $(SCHEMA).TokenSesion
    SET Revocado = 1
    WHERE RefreshTokenHash = @RefreshTokenHash;
END;
GO
