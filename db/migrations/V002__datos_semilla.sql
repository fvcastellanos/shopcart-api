-- ══════════════════════════════════════════════════════════════════════════
-- V002: Datos semilla
-- Roles, usuarios de prueba (hash bcrypt), catálogo y cupones de ejemplo.
--
-- Credenciales de prueba (ver README):
--   admin@shopcart.com     / Admin123!      → Administrador
--   operador@shopcart.com  / Operador123!   → Operador
--   cliente@shopcart.com   / Cliente123!    → Cliente
--   maria@shopcart.com     / Maria123!      → Cliente
-- ══════════════════════════════════════════════════════════════════════════


-- ── Roles ────────────────────────────────────────────────────────────────────
INSERT INTO $(SCHEMA).Rol (Nombre, Descripcion) VALUES
('Cliente',       'Compra y consulta solo su propia información.'),
('Operador',      'Gestiona pedidos e inventario.'),
('Administrador', 'Gestiona catálogo, precios, cupones, usuarios y reportes.');
GO


-- ── Usuarios de prueba (contraseñas con hash bcrypt) ─────────────────────────
INSERT INTO $(SCHEMA).Usuario (Correo, PasswordHash, Nombre, IDRol) VALUES
('admin@shopcart.com',
 '$2b$12$VfqaArwjPdlo4lnHbwbKKuDILJRO5I5OdMOwa8UxNX2g2ZvSxQ8Va',
 'Administrador Principal',
 (SELECT IDRol FROM $(SCHEMA).Rol WHERE Nombre = 'Administrador')),
('operador@shopcart.com',
 '$2b$12$aTNZD36hQ1LhNmrGzgeVo.mzD3oaU2E4kO4Q5/Ge0KGmJpSPxi4XG',
 'Operador de Tienda',
 (SELECT IDRol FROM $(SCHEMA).Rol WHERE Nombre = 'Operador')),
('cliente@shopcart.com',
 '$2b$12$r5QKf.HfGybFNkcc7rSvsOtXk5ujV0J/SPr.Ekl76mg48C7Z60tdq',
 'Cliente Demo',
 (SELECT IDRol FROM $(SCHEMA).Rol WHERE Nombre = 'Cliente')),
('maria@shopcart.com',
 '$2b$12$5G7G78KQ3HxKzu6QH.zrxOlxgJ3Q9FFjZRigxk57afxgAGByFEEKW',
 'María López',
 (SELECT IDRol FROM $(SCHEMA).Rol WHERE Nombre = 'Cliente'));
GO


-- ── Categorías ───────────────────────────────────────────────────────────────
INSERT INTO $(SCHEMA).Categoria (Nombre) VALUES
('Electronica'),
('Ropa'),
('Hogar'),
('Deportes'),
('Libros');
GO


-- ── Productos ────────────────────────────────────────────────────────────────
INSERT INTO $(SCHEMA).Producto (Nombre, Descripcion, IDCategoria) VALUES
('Smartphone X1',        'Smartphone de gama media, pantalla de 6.5 pulgadas.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Electronica')),
('Auriculares Bluetooth','Auriculares inalámbricos con cancelación de ruido.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Electronica')),
('Camiseta Básica',      'Camiseta de algodón 100%, corte regular.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Ropa')),
('Jeans Clásicos',       'Jeans de corte recto, mezclilla resistente.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Ropa')),
('Lámpara de Escritorio','Lámpara LED ajustable con luz cálida.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Hogar')),
('Juego de Sábanas',     'Sábanas de algodón egipcio, 400 hilos.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Hogar')),
('Balón de Fútbol',      'Balón oficial tamaño 5, cosido a máquina.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Deportes')),
('Bicicleta de Montaña', 'Bicicleta de 21 velocidades con suspensión delantera.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Deportes')),
('Cien Años de Soledad', 'Novela de Gabriel García Márquez.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Libros')),
('El Principito',        'Obra clásica de Antoine de Saint-Exupéry.',
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Libros'));
GO


-- ── Variantes (SKU, precio y existencia propios) ─────────────────────────────
INSERT INTO $(SCHEMA).Variante (IDProducto, SKU, Precio, Existencia) VALUES
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Smartphone X1'),         'SMX1-NEG-128', 2499.99, 50),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Smartphone X1'),         'SMX1-NEG-256', 2899.99, 30),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Auriculares Bluetooth'), 'AUR-BT-NEG',    399.99, 100),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Camiseta Básica'),       'CAM-BAS-M-BLA',  99.99, 200),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Camiseta Básica'),       'CAM-BAS-L-BLA',  99.99, 150),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Camiseta Básica'),       'CAM-BAS-M-NEG',  99.99, 180),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Jeans Clásicos'),        'JEA-32-AZU',    299.99,  80),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Jeans Clásicos'),        'JEA-34-AZU',    299.99,  70),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Lámpara de Escritorio'), 'LAM-ESC-BLA',   249.99,  40),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Juego de Sábanas'),      'SAB-QUE-GRI',   349.99,  60),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Juego de Sábanas'),      'SAB-KIN-GRI',   399.99,  45),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Balón de Fútbol'),       'BAL-FUT-5',     149.99, 120),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Bicicleta de Montaña'),  'BIC-MON-27',   3499.99,  15),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Bicicleta de Montaña'),  'BIC-MON-29',   3799.99,  10),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'Cien Años de Soledad'),  'LIB-100-SOL',   129.99,  90),
((SELECT IDProducto FROM $(SCHEMA).Producto WHERE Nombre = 'El Principito'),         'LIB-PRIN-TAP',   89.99, 110);
GO


-- ── Atributos de variante (talla, color, etc.) ────────────────────────────────
INSERT INTO $(SCHEMA).VarianteAtributo (IDVariante, Nombre, Valor) VALUES
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SMX1-NEG-128'), 'Color',          'Negro'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SMX1-NEG-128'), 'Almacenamiento', '128GB'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SMX1-NEG-256'), 'Color',          'Negro'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SMX1-NEG-256'), 'Almacenamiento', '256GB'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'AUR-BT-NEG'),   'Color',          'Negro'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-M-BLA'), 'Talla',         'M'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-M-BLA'), 'Color',         'Blanco'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-L-BLA'), 'Talla',         'L'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-L-BLA'), 'Color',         'Blanco'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-M-NEG'), 'Talla',         'M'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'CAM-BAS-M-NEG'), 'Color',         'Negro'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'JEA-32-AZU'),    'Talla',         '32'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'JEA-32-AZU'),    'Color',         'Azul'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'JEA-34-AZU'),    'Talla',         '34'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'JEA-34-AZU'),    'Color',         'Azul'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'LAM-ESC-BLA'),   'Color',         'Blanco'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SAB-QUE-GRI'),   'Tamaño',        'Queen'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SAB-QUE-GRI'),   'Color',         'Gris'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SAB-KIN-GRI'),   'Tamaño',        'King'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'SAB-KIN-GRI'),   'Color',         'Gris'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'BAL-FUT-5'),     'Talla',         '5'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'BIC-MON-27'),    'Tamaño',        '27.5'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'BIC-MON-29'),    'Tamaño',        '29'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'LIB-100-SOL'),   'Formato',       'Tapa blanda'),
((SELECT IDVariante FROM $(SCHEMA).Variante WHERE SKU = 'LIB-PRIN-TAP'),  'Formato',       'Tapa dura');
GO


-- ── Cupones de ejemplo ────────────────────────────────────────────────────────
INSERT INTO $(SCHEMA).Cupon
    (Codigo, Tipo, Valor, MontoMinimo, FechaInicio, FechaFin, LimiteTotalUsos, LimiteUsoPorCliente, TotalUsos, IDCategoria, Activo)
VALUES
('BIENVENIDA10', 'Porcentaje', 10.00,   0.00,
 DATEADD(day, -30, SYSUTCDATETIME()), DATEADD(day, 90, SYSUTCDATETIME()),
 NULL, 1, 0, NULL, 1),
('DESCUENTO50',  'MontoFijo',  50.00, 500.00,
 DATEADD(day, -30, SYSUTCDATETIME()), DATEADD(day, 90, SYSUTCDATETIME()),
 100, 2, 0,
 (SELECT IDCategoria FROM $(SCHEMA).Categoria WHERE Nombre = 'Ropa'), 1);
GO
