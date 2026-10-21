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

Esto sí necesita credenciales reales de Supabase (no vienen en este repo):

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

Sin esas credenciales, probé que el camino completo no se cae: con JWT pero
sin archivo responde 400, con un archivo que no es imagen responde 400 con
el mensaje de RN-12, y con una imagen válida pero sin configurar Supabase
responde 500 con un mensaje de error claro en el log (no un error críptico)
en vez de quedarse colgado. Lo que no pude probar en esta sesión es la
subida real a un bucket de Supabase, porque no tengo esas credenciales —
nadie debería tomar esto como "ya probado de punta a punta" hasta que
alguien lo intente con un proyecto real.

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

- **Fuera de alcance a propósito** (como pidió la consigna): reportes,
  moderación, registro público de negocios (solo `npm run seed`) y pagos.
  Tampoco implementé los planes Gratis/Pro (RF13) ni la suspensión de
  negocios (RN-09); la tabla `negocios` tiene la columna `estado` pensando
  en esto, pero ningún caso de uso la usa todavía.
- **La subida de fotos (Etapa 4) no la probé con un Supabase Storage real**:
  construí el endpoint, el adaptador y el panel, y verifiqué todos los
  caminos de error (sin archivo, tipo inválido, sin credenciales
  configuradas), pero no tengo en esta sesión las credenciales del proyecto
  de Supabase del usuario para subir una imagen real y confirmar que el
  bucket, los permisos y la URL pública funcionan de punta a punta. Falta
  esa prueba manual con credenciales reales (ver "Cómo probar la subida de
  fotos" arriba).
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
