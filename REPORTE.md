# REPORTE — JAMA (MVP)

## 1. Qué construí

Monorepo `/api` (Node.js + Express, ESM) y `/web` (React + Vite), siguiendo la
arquitectura documentada en `docs/` (monolito modular, Clean Architecture por
módulo, PostgreSQL con transacción + `FOR UPDATE`, código de canje como
máquina de estados).

**4 módulos del MVP**, cada uno con `dominio/ → aplicacion/ → infraestructura/
→ presentacion/`, comunicados solo por su fachada (`index.js` o el módulo de
composición):

- **Acceso**: login con email/password, emite JWT.
- **Negocios**: credenciales (bcrypt) y datos de contacto (nombre, WhatsApp).
  Expone `verificarCredenciales` y `obtenerContacto` — nadie más lee su tabla.
- **Ofertas**: entidad `Oferta` (RN-01 precio oferta < carta, RN-03 stock ≥ 1
  y hora límite futura, RN-05 reservar, RN-08 liberar), repositorio
  PostgreSQL con `SELECT … FOR UPDATE`, y la fachada `reservarUnidad` /
  `liberarUnidad` que usa Pedidos dentro de la misma transacción.
- **Pedidos**: entidad `CodigoCanje` con su máquina de estados (RESERVADO →
  VENDIDO | NO_CONCRETADO | EXPIRADO, RN-06/07/08/10), casos de uso
  `PedirOferta`, `ResolverPedido` y `ExpirarReservas`, adaptador `wa.me` y
  generador de código de 4 caracteres sin ambigüedades (sin `0/O/1/I/L`).

**Endpoints** (`/api/v1`, JSON):

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/auth/login` | — | Devuelve `{ token, negocio }` |
| GET | `/ofertas` | — | Ofertas vigentes (ACTIVA, stock>0, hora_limite > ahora) |
| GET | `/ofertas/:id` | — | Detalle de una oferta |
| POST | `/negocios/me/ofertas` | JWT | Publica una oferta |
| POST | `/ofertas/:id/pedidos` | — (con *rate limit*) | Reserva stock → `{ codigo, enlaceWhatsapp, expiraEn }` |
| PATCH | `/pedidos/:codigo` | JWT | `{ concretado: true|false }` → confirma o rechaza |

**Reglas críticas** (de la consigna) implementadas tal cual se pidieron:

1. `PedirOferta` corre en una transacción real (`BEGIN` → `SELECT … FOR
   UPDATE` sobre la oferta → stock-1 → crea código RESERVADO (vence en 30
   min) → `COMMIT` → `201`). Sin stock: `ROLLBACK` → `409`.
2. `CodigoCanje` es una máquina de estados que solo sale de RESERVADO una vez
   (método privado `#transicion`); NO_CONCRETADO y EXPIRADO devuelven el
   stock (`stock + 1`).
3. Tarea `node-cron` cada minuto dentro de la misma API que expira las
   reservas de 30+ minutos (`ExpirarReservas`).
4. Un negocio que intenta tocar el código de otro recibe **404**, nunca 403
   (probado con PostgreSQL real).
5. `CHECK (stock >= 0)` en la base de datos (más la regla de dominio).
6. `CHECK (precio_oferta < precio_carta)` en la base de datos + regla RN-01.
7. Fechas: la API guarda y compara siempre instantes absolutos
   (`timestamptz`/`Date`), nunca una fecha de calendario derivada a mano —
   así se evita por construcción el error de restar/cortar un ISO string
   cerca de las 19:00 en Lima (bug típico: `fecha.toISOString().slice(0,10)`
   cambia de día una hora antes de lo esperado). No hubo necesidad de un
   helper de calendario porque este MVP no pide una fecha de vencimiento de
   producto separada de la hora límite (ver sección 3).
8. `express-rate-limit` en `POST /ofertas/:id/pedidos` (10 pedidos/minuto
   por IP) → `429`.

**Frontend** (`/web`): vitrina pública del cliente. Lista las ofertas de hoy
con foto (`loading="lazy"`), precio de carta tachado, precio de oferta y
botón **Pedir** que reserva el código y abre WhatsApp (`wa.me`) con el
mensaje prellenado; si el navegador bloquea el popup, muestra un botón
"Abrir WhatsApp" de respaldo. Marca: tipografía Nunito, colores lima
`#D4DC31` / azul marino `#1E2B4D` / crema `#FAF8EF`; el lima solo se usa
como fondo (insignia de descuento), nunca como texto sobre blanco. No se
usa la palabra "merma" en ningún texto visible al cliente.

## 2. Cómo correrlo

Ver [`README.md`](README.md) para el detalle completo. Resumen:

```bash
# Base de datos
createdb jama && createdb jama_test

# API
cd api && cp .env.example .env && npm install
npm run migrate && npm run seed    # negocio demo: panaderia@jama.pe / demo1234
npm start                           # http://localhost:3000

# Web
cd web && cp .env.example .env && npm install
npm run dev                         # http://localhost:5173
```

Probé manualmente el flujo completo (login → publicar oferta → listar →
pedir → wa.me → confirmar) contra la API real y, por separado, abrí la
vitrina en un navegador (Playwright/Chromium) para verificar que el
`fetch` a la API, el botón **Pedir** y la apertura de WhatsApp funcionan de
punta a punta.

## 3. Resultado de `npm test`

```
# tests 30
# suites 9
# pass 30
# fail 0
```

Corrí la suite completa dos veces seguidas (sin reiniciar la base de datos)
para confirmar que las pruebas de integración son idempotentes.

| Suite | Pruebas | Qué cubre |
|---|---|---|
| `tests/dominio/oferta.test.js` | 12 | RN-01, RN-03, RN-05, RN-08, vigencia — sin base de datos |
| `tests/dominio/codigo-canje.test.js` | 9 | RN-06, RN-07, RN-10, máquina de estados — sin base de datos |
| `tests/expiracion/expirar-reservas.test.js` | 3 | Expiración a los 30 min con `RelojFijo` inyectable (antes/justo después del límite; no toca códigos ya resueltos) |
| `tests/arquitectura/arquitectura.test.js` | 2 | Falla si `dominio/` o `aplicacion/` de cualquier módulo importa `express`, `pg`, `jsonwebtoken`, `bcrypt` o `node-cron` |
| `tests/concurrencia/pedir-oferta.concurrencia.test.js` | 1 | **Contra PostgreSQL real**: 50 `PedirOferta.ejecutar()` simultáneos sobre una oferta con stock=3 → exactamente 3 reservas, 47 rechazos `OfertaAgotadaError`, stock final en la base = 0, 3 códigos `RESERVADO` en la tabla |
| `tests/seguridad/aislamiento-negocios.test.js` | 3 | **Contra PostgreSQL real**: negocio B no puede resolver un código de negocio A (404 a nivel de caso de uso y a nivel de controlador HTTP, nunca 403); el dueño sí puede; un código inexistente también da 404 |

Nota técnica: las pruebas de concurrencia y seguridad crean su propio
negocio/oferta con UUID y evitan `TRUNCATE` global a propósito, porque
`node --test` puede correr varios archivos de prueba en paralelo contra la
misma base `jama_test`; un `TRUNCATE` compartido entre archivos hacía que el
test de concurrencia perdiera filas a mitad de las 50 peticiones (lo
encontré y lo corregí durante esta sesión).

## 4. Pendiente o dudoso

- **Fuera de alcance a propósito** (como pidió la consigna): módulos
  Reportes y Moderación, pagos, panel de negocio (`/negocio`) y admin en el
  frontend, registro público de negocios (solo hay `npm run seed`), planes
  Gratis/Pro (RF13) y suspensión de negocios (RN-09). La tabla `negocios`
  tiene la columna `estado` pensando en esto, pero ningún caso de uso la usa
  todavía.
- **`FinalizarOfertasVencidas` no existe como caso de uso propio**: el
  listado público ya filtra `hora_limite > ahora`, así que una oferta
  vencida deja de verse de inmediato, pero su columna `estado` en la base
  sigue en `ACTIVA` hasta que alguien la edite. No afecta la vitrina, pero un
  futuro panel de negocio que liste "mis ofertas" debería tenerlo en cuenta.
- **Caché de 30 s del listado (ADR-008) y paginación**: no implementadas;
  con el volumen de un MVP de una ciudad no hacían falta pruebas de carga
  reales para justificarlas, y el ADR las marca como optimización, no regla
  crítica.
- **Imágenes**: `fotoUrl` es un string libre; no hay subida de archivos ni
  CDN/WebP. El frontend ya usa `loading="lazy"`.
- **El cron de expiración vive dentro del proceso de la API**: si el proceso
  cae, las reservas vencidas no pasan a EXPIRADO hasta que se reinicie (el
  ADR-005 ya advierte este trade-off; con una sola instancia es aceptable
  para el MVP).
- **Colisión de código de canje**: el generador reintenta hasta 10 veces si
  el código ya está RESERVADO; además hay un índice único parcial en
  PostgreSQL como respaldo. Con 50 pedidos simultáneos en la prueba de
  concurrencia no hubo ninguna colisión.
- Eliminé un helper `fechas.js` (zona Lima) que había escrito al principio
  para la regla 7, porque terminó sin uso: como todo el sistema compara
  instantes absolutos (`timestamptz`), nunca necesité derivar una fecha de
  calendario. Si más adelante se agrega un campo de "fecha de vencimiento"
  del producto (distinto de la hora límite de recojo), ahí sí haría falta
  ese cálculo en zona Lima.
