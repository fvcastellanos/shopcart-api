# ShopCart API

Backend de **ShopCart**, plataforma web de ventas (reto Tech Challenge 360).
API construida con **Node.js + TypeScript (strict) + Express**, SQL Server y
acceso a datos mediante **Stored Procedures**.

> Proyecto esqueleto. Los módulos funcionales (RF-01 a RF-09) se implementan
> de forma incremental sobre esta estructura.

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24 LTS |
| Lenguaje | TypeScript (modo `strict`) |
| Framework | Express 5 |
| Base de datos | SQL Server 2019+ (acceso vía Stored Procedures con `mssql`) |
| Autenticación | Passport (estrategia JWT) |
| Validación | Zod |
| Logging | Pino |

> **Sin ORM.** Todo el acceso a datos se hace mediante Stored Procedures
> invocados con parámetros tipados (requisito obligatorio del reto).

---

## Estructura (arquitectura por capas)

```
shopcart-api/
├── db/
│   ├── migrate.ts             # Runner de migraciones (migrate / clean / status)
│   └── migrations/            # Scripts SQL versionados (V001__, V002__...)
├── src/
│   ├── app.ts                 # Configuración de Express (middlewares globales)
│   ├── server.ts              # Bootstrap del servidor
│   ├── config/                # Configuración (env, base de datos)
│   ├── routes/                # Definición de rutas (HTTP)
│   ├── controllers/           # Controladores (HTTP <-> servicios)
│   ├── services/              # Lógica de negocio
│   ├── repositories/          # Acceso a datos (Stored Procedures)
│   ├── middleware/            # Auth, roles, validación, errores
│   ├── auth/                  # Configuración de Passport
│   ├── schemas/               # Esquemas de validación (Zod)
│   ├── lib/                   # Utilidades (logger, errores, asyncHandler)
│   └── types/                 # Tipos compartidos
├── .env.example
├── package.json
└── tsconfig.json
```

**Flujo de una petición:** `routes` → `middleware` (validación/auth) →
`controllers` → `services` (reglas de negocio) → `repositories` (SPs) → SQL Server.

---

## Requisitos previos

- Node.js **24 LTS** o superior.
- SQL Server 2019+ (local o vía Docker).

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   Editar .env con las credenciales reales de SQL Server.
```

## Ejecución

```bash
# Desarrollo (hot reload con tsx)
npm run dev

# Compilar y ejecutar
npm run build
npm start

# Verificar tipos
npm run typecheck
```

Verificar el estado: `GET http://localhost:4000/v1/health`.

---

## Migraciones de base de datos

Runner propio estilo Flyway (`db/migrate.ts`): scripts SQL puros, versionados y
numerados, aplicados de forma incremental y reproducible. No usa ORM.

Los scripts viven en `db/migrations/` con el formato `V<numero>__<descripcion>.sql`
y pueden contener el separador de lote `GO` (necesario para `CREATE/ALTER
PROCEDURE`, `VIEW`, `FUNCTION`, `TRIGGER`).

La tabla `dbo.Migraciones` registra versión, checksum y fecha de aplicación,
permitiendo saber qué migraciones ya se ejecutaron.

### Comandos

```bash
npm run db:migrate   # aplica las migraciones pendientes (en orden, transaccional)
npm run db:status    # muestra qué migraciones están aplicadas y cuáles pendientes
npm run db:clean     # elimina todos los objetos de la base de datos
```

### Convenciones

- Un archivo por versión, numeración creciente (`V001`, `V002`, ...).
- Nunca editar una migración ya aplicada (se valida por checksum): crear una nueva.
- Los objetos de BD siguen el estándar del reto (`SP_Modulo_Proceso`, `ID`+nombre).

### Migraciones aplicadas

| Versión | Descripción |
|---|---|
| `V001` | Esquema base: 19 tablas, constraints e índices |
| `V002` | Datos semilla: roles, usuarios, catálogo y cupones |
| `V003` | SP de autenticación (RF-01) |
| `V004` | SP de catálogo (RF-02) |
| `V005` | SP de inventario/kardex (RF-03) |
| `V006` | SP de carrito (RF-04) |
| `V007` | SP de cupones + `FU_Cupones_CalculoDescuento` (RF-05) |
| `V008` | SP de direcciones, reservas y checkout (RF-06) |
| `V009` | SP de pedidos y devoluciones (RF-07) |
| `V010` | Vistas `VW_Dashboard_*` + SP de reportes (RF-08) |
| `V011` | SP de bitácora (RF-09) |

---

## Datos de prueba (seed)

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@shopcart.com` | `Admin123!` | Administrador |
| `operador@shopcart.com` | `Operador123!` | Operador |
| `cliente@shopcart.com` | `Cliente123!` | Cliente |
| `maria@shopcart.com` | `Maria123!` | Cliente |

Cupones de ejemplo: `BIENVENIDA10` (10% de descuento) y `DESCUENTO50`
(Q50 con mínimo de Q500, solo categoría Ropa).

---

## Decisiones técnicas

- **Acceso a datos solo por Stored Procedures** con el driver `mssql` y
  parámetros tipados (`src/repositories/sp.ts`): previene SQL injection y cumple
  el estándar del reto.
- **Passport + JWT** para autenticación (access token de corta duración y
  refresh token con rotación).
- **Zod** para validación declarativa de entrada en el API.
- **Manejo centralizado de errores** (`middleware/errorHandler.ts`) con
  respuestas JSON consistentes y códigos HTTP correctos.

## Convenciones

- Stored Procedures según el estándar del reto: `SP_Modulo_Proceso`
  (ej. `SP_Pedidos_CrearPedido`, `SP_Inventario_ReservarExistencia`).
- Montos y cantidades con `DECIMAL` / `INTEGER` (nunca `FLOAT`/`REAL`).
- Llaves primarias autoincrementables: `ID` + nombre (ej. `IDProducto`).
