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
  y hora límite futura, RN-05 reservar, RN-08 liberar, RN-11 tramos de precio
  por hora), repositorio PostgreSQL con `SELECT … FOR UPDATE`, y la fachada
  `reservarUnidad` / `liberarUnidad` / `obtenerResumen` que usa Pedidos dentro
  de la misma transacción (o sin ella, para solo leer el título).
- **Pedidos**: entidad `CodigoCanje` con su máquina de estados (RESERVADO →
  VENDIDO | NO_CONCRETADO | EXPIRADO, RN-06/07/08/10), casos de uso
  `PedirOferta`, `ResolverPedido`, `ExpirarReservas` y
  `ListarPedidosPorConfirmar`, adaptador `wa.me` y generador de código de 4
  caracteres sin ambigüedades (sin `0/O/1/I/L`).

**Frontend** (`/web`): vitrina pública del cliente en `/` y, desde esta
etapa, el panel del negocio en `/panel`. Marca: Nunito 400/700/900, lima
`#D4DC31` / azul marino `#1E2B4D` / crema `#FAF8EF` / gris `#5B6478`; el lima
solo se usa de fondo (insignia de descuento o estado), nunca como texto sobre
blanco.

### Etapa 3 — Panel del negocio (esta sesión)

**Precio que baja con la hora (RN-11, nueva regla de negocio).** Una oferta
puede tener tramos opcionales (`{ desde: "17:00", descuentoPct: 30 }`). El
precio vigente se calcula en el dominio (`Oferta.precioVigente(ahora)`) con
el reloj inyectado, convirtiendo `ahora` a hora de Lima con
`Intl.DateTimeFormat({ timeZone: "America/Lima" })` (nunca con la hora o el
`Date` crudo del servidor) — ver `compartido/dominio/fechas.js`. Sin tramos
vigentes todavía, se usa el precio de oferta fijo. Cada tramo se valida al
publicar: hora `HH:MM` válida, descuento entero 1–99 %, sin horas
duplicadas, el precio del tramo **menor al precio de oferta fijo** (no solo
al de carta) y el descuento **estrictamente creciente** según la hora —así
el precio solo puede bajar, nunca subir, entre tramos. (Esto corrigió un bug
real que encontré después de la primera entrega: con carta=40, oferta=20 y
tramos 17:00→30%/18:30→20%, el precio terminaba subiendo a S/28 y S/32 en
vez de bajar; ahora ambos se rechazan al publicar con un mensaje que le dice
al dueño qué tramo y por qué.) La vitrina pública muestra `precioVigente` y,
si hay un tramo siguiente, el aviso ("Baja a S/ X a las HH:MM"). Al pedir, el
precio vigente de ese instante se guarda en el código de canje (nueva
columna `codigos_canje.precio`) — el cliente paga lo que vio, aunque el
precio siga bajando después.

**Endpoints nuevos** (JWT, siempre filtrados por el negocio del token; una
oferta o un código de otro negocio responde 404, nunca 403):

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/negocios/me/ofertas?dia=hoy` | Mis ofertas de hoy (según el día calendario de Lima de `horaElaboracion`), con `precioVigente`, `proximoTramo` y `tramosPrecio` |
| PATCH | `/negocios/me/ofertas/:id` | `{ estado: "ACTIVA" \| "PAUSADA" }` — pausar/reanudar |
| GET | `/negocios/me/pedidos?estado=RESERVADO` | Códigos reservados con el título de la oferta y los minutos que quedan |

**Frontend `/panel`** (mobile-first, botones grandes, pocos pasos — pensado
para el celular del dueño al final del día): Login (guarda el JWT en
`localStorage`), Mis ofertas de hoy (estado, stock, Pausar/Reanudar), Publicar
oferta (incluye los tramos de precio) y Pedidos por confirmar (campo grande
para el código + botones Vendido/No vino, y la lista de códigos RESERVADO con
los minutos que les quedan).

**Correcciones de la revisión anterior:**

1. `ResolverPedido` ahora valida `codigoCanje.estaVencido(ahora)` antes de
   transicionar: si el código ya pasó su `expira_en` (aunque
   `ExpirarReservas` todavía no haya corrido), responde 409 "El código ya
   venció" y no lo marca vendido ni "no vino".
2. Rate limit de `POST /ofertas/:id/pedidos`: de 10 a 30 pedidos/minuto por
   IP (muchos celulares en Perú comparten la misma IP de operador).
3. Prueba de dominio agregada: a las 18:45 de Lima (23:45 UTC) se aplica el
   tramo de las 18:30, y a las 19:30 de Lima (00:30 UTC del día siguiente)
   sigue siendo el mismo día de la oferta (`esMismoDiaLima`).

### Etapa 4 — Subida de fotos (esta sesión)

`fotoUrl` ya no es un campo de texto que el dueño escribe a mano: el panel
sube la imagen real y la API la guarda en **Supabase Storage** (el ADR-007
ya dejaba definido el puerto `AlmacenImagenes` pensando en Cloudinary; como
el usuario ya tenía un proyecto de Supabase, el adaptador nuevo es
`SupabaseStorageAdapter` — cambiar de proveedor otra vez solo tocaría ese
archivo).

- **`POST /negocios/me/ofertas/fotos`** (JWT, `multipart/form-data`, campo
  `foto`): sube la imagen y devuelve `{ fotoUrl }` para usarla al publicar.
- **RN-12**: la foto debe ser JPG, PNG o WEBP (se valida en el caso de uso
  `SubirFotoOferta`, no en el middleware, para no duplicar la regla) y pesar
  como máximo 5 MB (eso sí lo acota `multer`, es un límite de transporte, no
  una regla de negocio).
- El adaptador habla con la API REST de Storage directo por `fetch`, sin
  agregar el SDK de Supabase como dependencia.
- En el panel, "Publicar oferta" reemplaza el campo de URL por un
  `<input type="file">`: vista previa inmediata al elegir la foto, la sube
  sola, y el botón de publicar queda deshabilitado mientras tanto.

### Etapa 5 — Despliegue en Vercel + Supabase (esta sesión)

El usuario pidió desplegar en Vercel (plan gratis) con Supabase como base de
datos, para probar el MVP. ADR-009 ya pedía que el frontend se sirviera como
SPA estática separada del backend — Vercel encaja ahí sin tocar nada. La API
sí necesitó tres ajustes, ninguno a la arquitectura por capas:

1. **`server.js` se partió en dos**: `crear-aplicacion.js` (la raíz de
   composición: arma los 4 módulos, igual que antes) y dos entradas finas —
   `server.js` (local, con `app.listen`, sin cambios de comportamiento) y
   `entrada-vercel.js` (exporta la app de Express para que Vercel la corra
   como función serverless). Ningún módulo (Acceso/Negocios/Ofertas/Pedidos)
   se tocó.
2. **El cron de expiración pasa de `node-cron` a un endpoint**:
   `GET /api/v1/cron/expirar-reservas`, que llama al mismo caso de uso
   `ExpirarReservas` de siempre. Lo dispara un Vercel Cron Job (definido en
   `api/vercel.json`, una vez al día porque el plan gratis no permite más
   seguido). Está protegido: sin el header `Authorization: Bearer
   <CRON_SECRET>` correcto responde 401 — y si `CRON_SECRET` no está
   configurado, se cierra por defecto en vez de quedar abierto. En Vercel,
   la plataforma genera y manda ese secreto sola al crear el cron job.
3. **`DATABASE_URL` en Vercel debe ser el *pooler* de transacciones de
   Supabase** (puerto 6543, usuario `postgres.<project-ref>`), no la
   conexión directa: cada invocación serverless puede caer en un proceso
   nuevo, y la conexión directa se queda sin cupo de conexiones rápido con
   tráfico concurrente. Es solo la variable de entorno — mismo `pg.Pool`,
   ningún código nuevo. Para `npm run migrate` sigue usándose la conexión
   directa (puerto 5432) porque el modo transacción del pooler no lleva bien
   los DDL.

Probé los tres cambios localmente: `npm test` sigue en 73/73, el servidor
local arranca igual que antes, `entrada-vercel.js` se probó sirviendo
peticiones reales envuelto en un `http.createServer` propio (confirma que
exporta un handler válido), y el endpoint del cron responde 401 sin
secreto, 401 con uno incorrecto y 200 (ejecutando `ExpirarReservas` de
verdad) con el correcto. Lo que no pude probar en esta sesión es el deploy
real en Vercel (no tengo acceso a vercel.com desde este sandbox) ni la
conexión real contra el pooler de Supabase con `DATABASE_URL` apuntando
ahí — eso alguien tiene que confirmarlo hacienda el deploy de verdad.

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

### Cómo probar el panel del negocio

1. Corre `npm run migrate && npm run seed` en `/api` (deja el negocio demo
   `panaderia@jama.pe` / `demo1234`).
2. Con la API (`npm start`) y la web (`npm run dev`) corriendo, abre
   `http://localhost:5173/panel`.
3. Entra con `panaderia@jama.pe` / `demo1234`.
4. En **Publicar**, crea una oferta; agrega un tramo de precio si quieres
   ver el aviso "Baja a S/ X a las HH:MM" en la vitrina y en el panel.
5. En **Ofertas**, usa Pausar/Reanudar.
6. Desde la vitrina pública (`http://localhost:5173/`, sin login) toca
   **Pedir** en esa oferta para generar un código.
7. En **Pedidos** del panel, escribe ese código y toca **Vendido** (o **No
   vino**); el código desaparece de "En espera".

Probé este flujo de punta a punta con Chromium headless (Playwright) contra
la API real: login → publicar con tramos → listar → pausar/reanudar → pedir
desde la vitrina → confirmar el código. Durante esa prueba encontré y
corregí un bug real: la pantalla de publicar navegaba a "Mis ofertas" en el
mismo render en que mostraba "¡Publicada!", así que el mensaje de éxito
nunca llegaba a verse; ahora la pantalla se queda en Publicar (con el
formulario limpio) y el dueño cambia de pestaña cuando quiere.

### Cómo probar la subida de fotos

Necesita credenciales reales de Supabase (no vienen en este repo):

1. En tu proyecto de Supabase: **Storage** → crea un bucket **público**
   (por ejemplo `fotos-ofertas`).
2. En **Project Settings → API**, copia la URL del proyecto y la
   `service_role key` (no la `anon`/`public`).
3. En `api/.env`, agrega:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<la service_role key>
   SUPABASE_STORAGE_BUCKET=fotos-ofertas
   ```
4. Reinicia la API. En el panel → Publicar oferta, elige una foto: debería
   verse la vista previa y, segundos después, "Foto lista ✓".

**Esto ya quedó probado de punta a punta en esta sesión**, con las
credenciales reales del Supabase del usuario: subí una imagen real por
`POST /negocios/me/ofertas/fotos`, la API la guardó en el bucket
`fotos-ofertas` y devolvió su URL pública, y confirmé por separado que esa
URL responde 200 con el `content-type` e igual cantidad de bytes que el
archivo subido (es decir, la sirve cualquiera sin login, como necesita la
vitrina). Borré esa imagen de prueba del bucket al terminar.

Nota solo para quien corra esto en un entorno con proxy de salida
restringido (como esta sandbox): el `fetch` nativo de Node no respeta
`HTTPS_PROXY` por defecto, así que ahí hubo que levantar la API con
`NODE_USE_ENV_PROXY=1 node src/server.js` para que la subida llegara a
Supabase. No toqué el código de la API por esto — en un servidor con salida
a internet directa (como será en producción) no hace falta esa variable.

### Cómo desplegar en Vercel + Supabase

**Web** (`/web`, ya tiene su `vercel.json`):
1. Importa el repo en Vercel, **Root Directory = `web`**.
2. Variable de entorno `VITE_API_URL` → la URL pública de tu API + `/api/v1`
   (Vite la incrusta en el build, tiene que estar puesta antes de desplegar).
3. Deploy. `/` y `/panel` funcionan con el mismo build (rewrite a
   `index.html`, el cliente decide qué mostrar).

**API** (`/api`, ya tiene su `vercel.json`):
1. Importa el repo **de nuevo como otro proyecto de Vercel**, **Root
   Directory = `api`** (son dos proyectos separados, como pide ADR-009).
2. En Supabase → Database → Connection string, copia la del **pooler de
   transacciones** (modo "Transaction", puerto 6543) tal cual la da el
   diálogo — no la armes a mano. Esa va en `DATABASE_URL` en Vercel.
3. Corre `npm run migrate -- "<conexión DIRECTA de Supabase, puerto 5432>"`
   **desde tu máquina** (no desde Vercel) para crear las tablas ahí.
4. Variables en Vercel: `DATABASE_URL` (el pooler), `JWT_SECRET`,
   `JWT_DURACION`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_STORAGE_BUCKET`. `CRON_SECRET` no hace falta ponerlo a mano:
   Vercel lo genera solo al ver el `crons` en `vercel.json`.
5. Deploy. El cron de expiración queda en manos de Vercel (una vez al día
   en el plan gratis; `ResolverPedido` igual rechaza un código vencido
   aunque el cron todavía no haya corrido, así que esto no afecta a los
   clientes — ver Etapa 3).

**No alcancé a probar el deploy real** (ni Vercel ni el pooler de Supabase
son alcanzables desde este sandbox). Sí probé, contra Postgres local, que
`entrada-vercel.js` exporta un handler de Express válido (lo serví
envuelto en un `http.createServer` propio y respondió 200) y que el
endpoint del cron hace exactamente lo que debe: 401 sin secreto, 401 con
uno incorrecto, 200 ejecutando `ExpirarReservas` con el correcto. El
deploy en sí y la conexión real al pooler quedan por confirmar con el
primer despliegue de verdad.

## 3. Resultado de `npm test`

```
# tests 73
# suites 21
# pass 73
# fail 0
```

Corrí la suite completa dos veces seguidas (sin reiniciar la base de datos)
para confirmar que las pruebas de integración son idempotentes.

| Suite | Pruebas | Qué cubre |
|---|---|---|
| `tests/dominio/oferta.test.js` | 29 | RN-01, RN-03, RN-05, RN-08, vigencia, RN-11 (tramos de precio: validación, orden, el precio de cada tramo menor al de oferta fijo, descuento estrictamente creciente, `precioVigente`, `proximoTramo`, incluye el caso 18:45/19:30 Lima) y `cambiarEstado` — sin base de datos |
| `tests/dominio/codigo-canje.test.js` | 10 | RN-06, RN-07, RN-10, máquina de estados, precio guardado al reservar — sin base de datos |
| `tests/dominio/fechas.test.js` | 5 | `horaMinutoLima` / `esMismoDiaLima` en zona America/Lima con `Intl`, incluyendo el caso de corrección (19:30 Lima = 00:30 UTC del día siguiente, mismo día) |
| `tests/expiracion/expirar-reservas.test.js` | 3 | Expiración a los 30 min con `RelojFijo` inyectable (antes/justo después del límite; no toca códigos ya resueltos) |
| `tests/expiracion/resolver-pedido-vencido.test.js` | 3 | Corrección: un código con `expira_en` pasado (aunque el cron no haya corrido) no se puede confirmar ni rechazar; justo antes de vencer, sí |
| `tests/arquitectura/arquitectura.test.js` | 2 | Falla si `dominio/` o `aplicacion/` de cualquier módulo importa `express`, `pg`, `jsonwebtoken`, `bcrypt` o `node-cron` |
| `tests/concurrencia/pedir-oferta.concurrencia.test.js` | 1 | **Contra PostgreSQL real**: 50 `PedirOferta.ejecutar()` simultáneos sobre una oferta con stock=3 → exactamente 3 reservas, 47 rechazos `OfertaAgotadaError`, stock final en la base = 0, 3 códigos `RESERVADO` en la tabla |
| `tests/integracion/precio-vigente.test.js` | 2 | **Contra PostgreSQL real**: el precio vigente al pedir (con y sin tramo activo) queda guardado en `codigos_canje.precio` |
| `tests/seguridad/aislamiento-negocios.test.js` | 7 | **Contra PostgreSQL real**: negocio B no puede resolver un código de negocio A, ni ver/pausar sus ofertas, ni ver sus pedidos reservados (404 a nivel de caso de uso y de controlador, nunca 403); el dueño sí puede |
| `tests/dominio/supabase-storage-adapter.test.js` | 5 | URLs de subida y públicas del adaptador de Storage (funciones puras, sin red) |
| `tests/dominio/subir-foto-oferta.test.js` | 6 | RN-12 (tipo de archivo) en `SubirFotoOferta` con un `AlmacenImagenes` falso, y el controlador: sin archivo → 400, archivo inválido → 400, válido → 201 |

Nota técnica: las pruebas de concurrencia y seguridad crean su propio
negocio/oferta con UUID y evitan `TRUNCATE` global a propósito, porque
`node --test` puede correr varios archivos de prueba en paralelo contra la
misma base `jama_test`; un `TRUNCATE` compartido entre archivos hacía que el
test de concurrencia perdiera filas a mitad de las 50 peticiones (lo
encontré y lo corregí en la sesión anterior).

## 4. Pendiente o dudoso

- **El deploy real en Vercel + Supabase no quedó probado**: construí y
  verifiqué todo lo que pude sin salir de este sandbox (el handler de
  Express para Vercel sirviendo peticiones reales, el endpoint del cron con
  sus tres casos de auth, los 73 tests sin romperse), pero ni Vercel ni el
  pooler de Supabase son alcanzables desde aquí. Falta confirmar, con un
  deploy real: que el build encuentra `entrada-vercel.js`, que el pooler de
  transacciones (puerto 6543) no tiene algún problema de SSL o de usuario
  (`postgres.<project-ref>`, no `postgres` a secas), y que el Vercel Cron
  Job efectivamente le pega al endpoint con el secreto correcto.
- **Fuera de alcance a propósito** (como pidió la consigna): reportes,
  moderación, registro público de negocios (solo `npm run seed`) y pagos.
  Tampoco implementé los planes Gratis/Pro (RF13) ni la suspensión de
  negocios (RN-09); la tabla `negocios` tiene la columna `estado` pensando
  en esto, pero ningún caso de uso la usa todavía.
- **No hay borrado de fotos huérfanas**: si el dueño elige otra imagen antes
  de terminar de publicar, o la oferta nunca se publica, la foto ya subida
  se queda en el bucket sin que nada la asocie ni la borre. Para un MVP de
  una ciudad el costo de almacenamiento es marginal, pero es una fuga real.
- **"Hoy" en `GET /negocios/me/ofertas?dia=hoy`** lo definí como "el día
  calendario de Lima de `horaElaboracion`". Es una interpretación razonable
  (la hora de elaboración representa el lote del día), pero la consigna no
  lo especifica exactamente así; si el negocio publica de madrugada para el
  mismo día, esto sigue funcionando porque compara por día de Lima, no por
  hora de corte fija.
- **El panel no cierra sesión sola si el token JWT expira** (dura 12h): si
  el dueño deja el panel abierto más de 12 horas, las llamadas a la API
  empezarán a fallar con 401 y el panel mostrará el mensaje de error
  genérico de cada pantalla en vez de mandarlo de vuelta al login
  automáticamente. No llegué a implementar ese manejo global; queda como
  pendiente real, no decidí que no hacía falta.
- **Los tramos de precio no se pueden editar después de publicar** (no hay
  endpoint de edición de oferta, solo publicar y pausar/reanudar); si el
  dueño se equivoca en un tramo, tiene que pausar esa oferta y publicar otra.
- **`FinalizarOfertasVencidas` sigue sin existir como caso de uso propio**:
  una oferta vencida deja de verse en la vitrina pública de inmediato
  (filtro `hora_limite > ahora`), pero su columna `estado` sigue en
  `ACTIVA` hasta que alguien la edite; "Mis ofertas de hoy" sí la sigue
  mostrando como ACTIVA aunque ya haya pasado su hora límite — no agregué
  un estado visual de "vencida" en el panel, solo lo que ya daba la API.
- **Caché de 30 s del listado (ADR-008) y paginación**: siguen sin
  implementarse; no hacían falta pruebas de carga reales para un MVP de una
  ciudad.
- **Colisión de código de canje**: el generador reintenta hasta 10 veces si
  el código ya está RESERVADO, más un índice único parcial en PostgreSQL
  como respaldo.
- **El cron de expiración vive dentro del proceso de la API** (ADR-005):
  si el proceso cae, las reservas vencidas no pasan a EXPIRADO hasta que se
  reinicie; con una sola instancia es aceptable para el MVP. La corrección
  de "código ya vencido" de esta etapa cubre justo la ventana en la que esto
  importaría (el negocio intenta confirmar antes de que el cron corra).
