-- ══════════════════════════════════════════════════════════════════════════
-- V014: Corrección de unicidad del Token de Carrito (RF-04)
-- La constraint UQ_Carrito_Token impedía tener más de un carrito con Token
-- NULL (carritos de usuarios autenticados). Se reemplaza por un índice único
-- filtrado que solo aplica cuando Token NO es nulo.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE $(SCHEMA).Carrito DROP CONSTRAINT UQ_Carrito_Token;
GO

CREATE UNIQUE INDEX UQ_Carrito_Token
    ON $(SCHEMA).Carrito (Token)
    WHERE Token IS NOT NULL;
GO
