classDiagram
direction BT
class Bitacora {
   int IDUsuario
   nvarchar(100) Entidad
   nvarchar(20) Accion
   nvarchar(max) ValorAnterior
   nvarchar(max) ValorNuevo
   datetime2 Fecha
   int IDBitacora
}
class Carrito {
   int IDUsuario
   nvarchar(64) Token
   datetime2 FechaCreacion
   datetime2 FechaUltimaActividad
   int IDCarrito
}
class Categoria {
   nvarchar(100) Nombre
   bit Activo
   int IDCategoria
}
class Cupon {
   nvarchar(50) Codigo
   nvarchar(20) Tipo
   decimal(10,2) Valor
   decimal(10,2) MontoMinimo
   datetime2 FechaInicio
   datetime2 FechaFin
   int LimiteTotalUsos
   int LimiteUsoPorCliente
   int TotalUsos
   int IDCategoria
   bit Activo
   int IDCupon
}
class CuponUso {
   int IDCupon
   int IDUsuario
   int IDPedido
   datetime2 FechaUso
   int IDCuponUso
}
class DetalleCarrito {
   int IDCarrito
   int IDVariante
   int Cantidad
   int IDDetalleCarrito
}
class DetallePedido {
   int IDPedido
   int IDVariante
   int Cantidad
   decimal(10,2) PrecioUnitario
   decimal(10,2) DescuentoLinea
   int CantidadDevuelta
   int IDDetallePedido
}
class Direccion {
   int IDUsuario
   nvarchar(200) Linea1
   nvarchar(200) Linea2
   nvarchar(100) Ciudad
   nvarchar(100) Departamento
   nvarchar(20) CodigoPostal
   nvarchar(255) Referencia
   bit EsPrincipal
   bit Activo
   datetime2 FechaCreacion
   int IDDireccion
}
class HistorialEstadoPedido {
   int IDPedido
   nvarchar(20) EstadoAnterior
   nvarchar(20) EstadoNuevo
   int IDUsuario
   datetime2 Fecha
   int IDHistorialEstadoPedido
}
class Kardex {
   int IDVariante
   nvarchar(20) TipoMovimiento
   int Cantidad
   int ExistenciaNueva
   nvarchar(255) Motivo
   int IDUsuario
   datetime2 FechaRegistro
   int IDKardex
}
class Migraciones {
   nvarchar(50) Version
   nvarchar(255) Descripcion
   nvarchar(64) Checksum
   datetime2 EjecutadaEn
   int ID
}
class Pedido {
   int IDUsuario
   int IDDireccion
   int IDCupon
   nvarchar(20) Estado
   decimal(12,2) Subtotal
   decimal(12,2) Descuento
   decimal(12,2) Total
   nvarchar(50) NumeroSeguimiento
   nvarchar(64) ClaveIdempotencia
   datetime2 FechaCreacion
   int IDPedido
}
class Producto {
   nvarchar(200) Nombre
   nvarchar(max) Descripcion
   int IDCategoria
   bit Activo
   datetime2 FechaCreacion
   int IDProducto
}
class ProductoImagen {
   int IDProducto
   nvarchar(500) URL
   bit EsPrincipal
   int Orden
   int IDProductoImagen
}
class ReservaInventario {
   int IDVariante
   int IDCarrito
   int Cantidad
   nvarchar(20) Estado
   datetime2 FechaReserva
   datetime2 FechaExpiracion
   int IDReservaInventario
}
class Rol {
   nvarchar(50) Nombre
   nvarchar(255) Descripcion
   bit Activo
   int IDRol
}
class TokenSesion {
   int IDUsuario
   nvarchar(255) RefreshTokenHash
   datetime2 FechaExpiracion
   bit Revocado
   datetime2 FechaCreacion
   int IDTokenSesion
}
class Usuario {
   nvarchar(255) Correo
   nvarchar(255) PasswordHash
   nvarchar(150) Nombre
   int IDRol
   bit Activo
   datetime2 FechaCreacion
   int IDUsuario
}
class Variante {
   int IDProducto
   nvarchar(50) SKU
   decimal(10,2) Precio
   int Existencia
   bit Activo
   int IDVariante
}
class VarianteAtributo {
   int IDVariante
   nvarchar(50) Nombre
   nvarchar(100) Valor
   int IDVarianteAtributo
}

Bitacora  -->  Usuario : IDUsuario
Carrito  -->  Usuario : IDUsuario
Cupon  -->  Categoria : IDCategoria
CuponUso  -->  Cupon : IDCupon
CuponUso  -->  Pedido : IDPedido
CuponUso  -->  Usuario : IDUsuario
DetalleCarrito  -->  Carrito : IDCarrito
DetalleCarrito  -->  Variante : IDVariante
DetallePedido  -->  Pedido : IDPedido
DetallePedido  -->  Variante : IDVariante
Direccion  -->  Usuario : IDUsuario
HistorialEstadoPedido  -->  Pedido : IDPedido
HistorialEstadoPedido  -->  Usuario : IDUsuario
Kardex  -->  Usuario : IDUsuario
Kardex  -->  Variante : IDVariante
Pedido  -->  Cupon : IDCupon
Pedido  -->  Direccion : IDDireccion
Pedido  -->  Usuario : IDUsuario
Producto  -->  Categoria : IDCategoria
ProductoImagen  -->  Producto : IDProducto
ReservaInventario  -->  Carrito : IDCarrito
ReservaInventario  -->  Variante : IDVariante
TokenSesion  -->  Usuario : IDUsuario
Usuario  -->  Rol : IDRol
Variante  -->  Producto : IDProducto
VarianteAtributo  -->  Variante : IDVariante
