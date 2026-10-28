# ShopCart API

Backend de **ShopCart**, plataforma web de ventas (reto Tech Challenge 360).
API REST construida con **Node.js + TypeScript (strict) + Express**, SQL Server y
acceso a datos mediante **Stored Procedures**.

Implementa los módulos funcionales **RF-01 a RF-09** del reto: autenticación,
catálogo, inventario, carrito, cupones, checkout, pedidos, dashboard y bitácora.

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24 LTS |
| Lenguaje | TypeScript (modo `strict`) |
| Framework | Express 5 |
| Base de datos | SQL Server 2019+ (acceso vía Stored Procedures con `mssql`) |
| Migraciones | Runner propio estilo Flyway (`db/migrate.ts`), scripts SQL versionados |
| Autenticación | Passport (JWT + refresh token con rotación) |
| Validación | Zod |
| Logging | Pino |

> **Sin ORM.** Todo el acceso a datos se hace mediante Stored Procedures
> invocados con parámetros tipados (requisito obligatorio del reto).

---

## Requisitos previos

- Node.js **24 LTS** o superior.
- SQL Server 2019+ (instancia accesible).

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   Editar .env con las credenciales reales de SQL Server.

# 3. Aplicar migraciones (crea el esquema, objetos y datos semilla)
npm run db:migrate
```

## Configuración (`.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default `4000`) |
| `DB_HOST` / `DB_PORT` | Servidor SQL Server |
| `DB_NAME` | Nombre de la base de datos |
| `DB_SCHEMA` | Esquema donde viven todos los objetos (default `shopcart`) |
| `DB_USER` / `DB_PASSWORD` | Credenciales de acceso |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos para firmar tokens |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Vida útil de los tokens |
| `CORS_ORIGIN` | Origen permitido en CORS |
| `APP_NAME` / `APP_VERSION` | (opcional) sobrescriben `name`/`version` de `package.json` |
| `GIT_COMMIT` / `GIT_TAG` / `GIT_BRANCH` | (opcional) info de despliegue para `/actuator/info` |

---

## Ejecución

```bash
npm run dev         # desarrollo (hot reload con tsx)
npm run build       # compila a dist/
npm start           # ejecuta el compilado
npm run typecheck   # verifica tipos (tsc --noEmit)
```

Verificar el estado:

```bash
curl http://localhost:4000/v1/actuator/health
# {"status":"ok","service":"shopcart-api","timestamp":"..."}

curl http://localhost:4000/v1/actuator/info
# {"nombre":"shopcart-api","version":"0.1.0","commit":"9f4d2a6","tag":"none","branch":"main"}
```

---

## Estructura (arquitectura por capas)

```
shopcart-api/
├── db/
│   ├── migrate.ts              # Runner de migraciones (migrate / clean / status)
│   └── migrations/             # V001__*.sql … V011__*.sql
├── src/
│   ├── app.ts                  # Configuración de Express (helmet, cors, json)
│   ├── server.ts               # Bootstrap del servidor
│   ├── config/                 # env, database (mssql), redis
│   ├── auth/                   # Configuración de Passport (JWT)
│   ├── middleware/             # authenticate, authorize, validate, errorHandler, notFound
│   ├── lib/                    # asyncHandler, errors, logger, buildInfo
│   ├── types/                  # AuthUser + augmentación de Express
│   ├── schemas/                # Validación Zod por recurso (common, auth, categoria, …)
│   ├── repositories/           # Acceso a datos por entidad (sp, usuario, producto, …)
│   ├── services/               # Lógica de negocio por recurso
│   ├── controllers/            # Controladores HTTP por recurso (+ actuators/)
│   └── routes/                 # Rutas por recurso (index monta en /v1)
├── .env.example
├── package.json
└── tsconfig.json
```

**Flujo de una petición:** `routes` → `middleware` (validación/auth) →
`controllers` → `services` (reglas de negocio) → `repositories` (SPs) → SQL Server.

Cada recurso sigue la misma convención (un archivo por capa), por ejemplo el
catálogo: `categoria/producto/variante` en `schemas`, `repositories`, `services`,
`controllers` y `routes`.

---

## Migraciones de base de datos

Runner propio estilo Flyway (`db/migrate.ts`): scripts SQL puros, versionados y
numerados, aplicados de forma incremental y reproducible. No usa ORM.

Los scripts viven en `db/migrations/` con el formato `V<numero>__<descripcion>.sql`
y pueden contener el separador de lote `GO` (necesario para `CREATE/ALTER
PROCEDURE`, `VIEW`, `FUNCTION`, `TRIGGER`).

La tabla `<esquema>.Migraciones` registra versión, checksum y fecha de
aplicación, permitiendo saber qué migraciones ya se ejecutaron. Todas las
migraciones están **aisladas al esquema configurado en `DB_SCHEMA`** (por defecto
`shopcart`); `db:clean` solo borra ese esquema, sin tocar el resto de la BD.

### Comandos

```bash
npm run db:migrate   # aplica las migraciones pendientes (en orden, transaccional)
npm run db:status    # muestra qué migraciones están aplicadas y cuáles pendientes
npm run db:clean     # elimina los objetos del esquema (solo DB_SCHEMA)
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

**Total de objetos:** 19 tablas · 59 Stored Procedures · 1 función · 3 vistas.

---

## API REST

Todas las rutas están prefijadas con `/v1`.

### Roles

| Rol | Acceso |
|---|---|
| `Cliente` | Compra y consulta su propia información (carrito, pedidos, direcciones) |
| `Operador` | Gestiona pedidos e inventario |
| `Administrador` | Gestiona además catálogo, cupones, usuarios, reportes y bitácora |

### Endpoints

| Recurso | Métodos | Acceso |
|---|---|---|
| `/actuator/health`, `/actuator/info` | GET | público |
| `/auth` | `POST /register`, `POST /login`, `POST /refresh` | público |
| `/categorias` | GET (lista), POST, `PUT /:id`, `DELETE /:id` | lectura pública · escritura Admin |
| `/productos` | GET (búsqueda/filtros), `GET /:id`, POST, `PUT /:id`, `DELETE /:id` | lectura pública · escritura Admin |
| `/variantes` | POST, `PUT /:id`, `DELETE /:id` | Admin |
| `/inventario` | `GET /:id/existencia`, `GET /:id/kardex`, `POST /:id/entradas`, `POST /:id/ajustes` | Operador/Admin |
| `/carrito` | POST, `GET /:id`, `POST /:id/items`, `PUT /:id/items/:idVariante`, `DELETE /:id/items/:idVariante`, `DELETE /:id/items` | invitado o autenticado |
| `/cupones` | GET (lista), `GET /codigo/:codigo`, POST, `PUT /:id`, `DELETE /:id` | Admin |
| `/direcciones` | GET, POST, `PUT /:id`, `DELETE /:id` | Cliente (propias) |
| `/reservas` | POST, `POST /liberar-vencidas` | Cliente · Admin |
| `/pedidos` | POST, `GET /mios`, GET (lista), `GET /:id`, `PATCH /:id/estado`, `POST /:id/devoluciones` | Cliente (propios) · Operador/Admin |
| `/dashboard` | `GET /ventas-por-periodo`, `GET /productos-mas-vendidos`, `GET /resumen` | Admin |
| `/bitacora` | GET (filtros + paginación) | Admin |

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
  el estándar del reto. Sin ORM ni SQL dinámico concatenado (el único SQL
  dinámico usa `sp_executesql` con whitelist de ordenamiento).
- **Arquitectura por capas y por recurso**: cada entidad tiene sus archivos en
  `schemas`, `repositories`, `services`, `controllers` y `routes`.
- **Passport + JWT** para autenticación (access token de corta duración y
  refresh token con rotación, almacenado como hash en `TokenSesion`).
- **Checkout atómico e idempotente**: `SP_Pedidos_CrearPedido` usa `XACT_ABORT`
  + transacción, `ClaveIdempotencia` UNIQUE y decremento de existencia atómico
  (`UPDATE ... WHERE Existencia >= Cantidad`) para evitar sobreventa.
- **Esquema aislado**: todos los objetos viven en el esquema `DB_SCHEMA`
  (default `shopcart`), separado del resto de la base de datos.
- **Zod** para validación declarativa de entrada en el API.
- **Manejo centralizado de errores** (`middleware/errorHandler.ts`) con
  respuestas JSON consistentes, códigos HTTP correctos y mapeo de errores de
  negocio (`THROW 50xxx`) a 404/409.

## Convenciones

- Stored Procedures: `SP_Modulo_Proceso`
  (ej. `SP_Pedidos_CrearPedido`, `SP_Inventario_ReservarExistencia`).
- Vistas: `VW_Modulo_Proceso` · Funciones tipo tabla: `FU_Modulo_Proceso`.
- Llaves primarias autoincrementables: `ID` + nombre (ej. `IDProducto`).
- Montos y cantidades con `DECIMAL` / `INTEGER` (nunca `FLOAT`/`REAL`).
- Tablas en singular; constraints con prefijos `PK_`, `FK_`, `UQ_`, `DF_`, `CHK_`, `IX_`.
