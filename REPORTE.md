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
si hay un tramo siguiente, el aviso ("Baja a S/ X a las HH:MM") — *nota: esto
quedó pendiente en el frontend hasta la Etapa 6, ver más abajo; la tarjeta
mostraba `precioOferta` fijo y nunca el aviso del próximo tramo.* Al pedir, el
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

### Etapa 6 — Rediseño de la vitrina pública (esta sesión)

El equipo compartió el diseño de un landing de referencia ("MVP del MVP",
mismo brand kit) con secciones que la vitrina real todavía no tenía: hero,
"Así de fácil", FAQ, CTA para negocios y ejemplos de ofertas. Se adaptó a
cómo funciona JAMA de verdad (sin cuentas de cliente, sin carrito — por eso
no se copiaron "Favoritos"/"Mi cuenta"/"Carrito" del diseño de referencia:
no existen en el modelo de negocio real).

**Bug encontrado y corregido de paso**: revisando `OfertaCard.jsx` antes de
tocarlo, el componente mostraba `oferta.precioOferta` (el precio fijo) en
vez de `oferta.precioVigente`, y nunca mostraba el aviso de `proximoTramo`
— pese a que la API ya devolvía ambos campos (Etapa 3) y el REPORTE.md de
esa etapa decía que ya estaba hecho. Ahora la tarjeta usa `precioVigente`
(con `precioOferta` como respaldo si la API no lo manda) y muestra "Baja a
S/ X a las HH:MM" cuando hay un tramo siguiente.

**Secciones nuevas** (`web/src/components/`): `Header` (logo + "Publicar una
oferta" → `/panel`, sin login de cliente), `Hero` (tagline, botón que hace
scroll a las ofertas, 3 insignias de confianza), `ComoFunciona` (los 3 pasos
reales: elegir, pedir sin registro, pagar y recoger), `Faq` (acordeón, 6
preguntas con respuestas que describo abajo) y `CtaNegocio` (invita a
publicar, enlaza a `/panel`).

**Ejemplos ilustrativos** (`web/src/data/ejemplosIlustrativos.js` +
`EjemplosIlustrativos`/`EjemploCard`): 20 productos de ejemplo (sazón,
dulces, panadería, ensaladas) que solo se muestran cuando la lista real de
`/ofertas` viene vacía — nunca se mezclan con datos reales de la API, y la
sección siempre lleva un aviso visible ("estos son ejemplos ilustrativos,
no ofertas reales") para que nadie los confunda con una oferta real.

**Fotos reales del brand kit** (no emojis): el usuario compartió el repo
público `AntonyParedes/jamaweb` (su propia "MVP del MVP" con el mismo
brand kit) para reusar sus assets. De ahí salen `web/src/assets/jama-hero.webp`
(el mockup de celular + torta que ahora ilustra el Hero) y
`web/src/assets/jama-demo-foods.webp` (una sola imagen en grilla 5×4 con las
20 fotos de los ejemplos ilustrativos, recortada por posición vía CSS en vez
de cargar 20 archivos sueltos — la misma técnica que ya usaba ese repo en
`ProductPhoto.tsx`, con los mismos cortes por fila/columna). Ambas se
reexportaron a WebP y se comprimieron (el hero bajó de 1.2 MB a 61 KB, la
grilla de 3 MB a 290 KB) antes de subirlas a este repo.

*Bug encontrado al integrar las fotos*: la primera versión de `EjemploCard`
le puso `object-fit: cover` a la imagen recortada, lo que rompe la técnica
de recorte por porcentaje (hace que el navegador vuelva a calcular qué
parte de la imagen mostrar según su propio aspect-ratio, en vez de respetar
el recorte exacto) — el síntoma, visible en capturas, era que varias
tarjetas mostraban dos platos distintos superpuestos en la misma foto. Se
quitó esa propiedad (el repo de referencia tampoco la usa en el modo
recortado) y se cambió el contenedor a `aspect-ratio: 1/1` como el original,
para minimizar la distorsión.

**Las 6 preguntas del FAQ** (escritas para esta sesión, basadas en cómo
funciona JAMA): el repo de referencia sí trae un FAQ (4 preguntas, con
respuestas genéricas tipo "coordina el horario con el vendedor"), pero ahí
cada negocio define su propio horario de recojo — en JAMA es siempre fijo,
6 a 7 pm, y JAMA sí define reglas propias (RN-11, el código de 4
caracteres, el rate limit). Por eso el FAQ de la vitrina no es una copia:
cubre si hace falta cuenta para pedir, cómo se paga (Yape/efectivo por
WhatsApp, JAMA no cobra), el horario fijo de recojo, qué hacer con el
código, qué pasa si la oferta se agota antes de pedirla, y cómo publica un
negocio sus ofertas.

Verificado con `npm run build` y `npm run lint` en `/web` (sin errores
nuevos) y con capturas de Playwright en móvil (390px) y escritorio
(1280px): la vitrina sin ofertas reales (muestra los ejemplos con el
aviso), con una oferta real con tramo de precio (precio vigente correcto +
aviso "Baja a..."), con error de red, y el acordeón de FAQ abriendo y
cerrando.

**Segunda pasada: sistema visual** — la primera versión de estas secciones
usaba CSS genérico (texto plano, emoji como íconos) y, al compararla con el
repo de referencia, se veía notablemente menos pulida. Se rehizo el sistema
de diseño para igualar el del repo de referencia manteniendo los colores de
marca de JAMA: se agregó `lucide-react` (iconos reales en vez de emoji en
insignias, pasos, FAQ y botones), se copiaron del repo de referencia los
valores de sombra (`shadow-soft`), radios de borde y el efecto "press"
(`transform: scale(0.96)` al tocar un botón), y las tarjetas de oferta y de
ejemplo pasaron a un formato tipo `ProductCard` (foto cuadrada, badge de
descuento en píldora lima arriba-izquierda, grid responsive 2/3/4
columnas). El encabezado ahora es `sticky` con fondo translúcido, y el FAQ
usa un acordeón con línea divisoria y chevron en vez de tarjetas con
sombra. Las fotos de ejemplo ahora muestran además la etiqueta "Ejemplo ·
foto ilustrativa" (igual que en el repo de referencia) en vez de solo
bajar la opacidad de la tarjeta.

### Etapa 7 — Bug en producción: `/panel` daba 404 (esta sesión)

El usuario reportó, con captura de DevTools, que `jama-iota.vercel.app/panel`
devolvía `404 NOT_FOUND` (`/` sí cargaba bien). Como este sandbox no tiene
salida de red hacia `*.vercel.app`, no pude reproducirlo en vivo, pero sí
pude leer la documentación oficial de Vercel Services (`vercel.com/docs/services/routing`,
alcanzable desde aquí) para encontrar la causa exacta.

**Causa**: al migrar a un solo proyecto Vercel con `services` (Etapa 5), se
borró el `web/vercel.json` que tenía el rewrite típico de toda SPA
(`"/(.*)" → "/index.html"`). La doc de Vercel lo confirma: *"Routing into a
service is final. If no route matches inside the service, Vercel does not
fall back to your other top-level rewrites. It returns the service's
not-found response."* — es decir, el rewrite raíz sí mandaba `/panel` al
servicio `web`, pero dentro de ese servicio (un build estático de Vite) no
existe ningún archivo llamado `panel`, así que Vercel devolvía el 404 propio
del servicio en vez de caer de vuelta a `index.html`. Por eso `/` funcionaba
(coincide con un archivo real) y `/panel` no (no hay archivo, y el enrutado
del cliente con React que decide qué mostrar según `window.location.pathname`
nunca llegaba a ejecutarse).

**Arreglo**: la misma doc dice que un service puede definir sus propios
`rewrites` (misma sintaxis que los de nivel superior), que corren *después*
de que el rewrite raíz ya enrutó la petición hacia él. Se agregó ese rewrite
dentro de la definición del servicio `web` en `vercel.json`:

```json
"web": {
  "root": "web",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**No pude confirmarlo con un deploy real** (mismo motivo: sin salida de red
a Vercel ni a `*.vercel.app` desde este sandbox). Falta que alguien con
acceso al dashboard de Vercel confirme que, tras el próximo deploy de este
commit, `/panel` carga el panel del negocio en vez de dar 404.

### Etapa 8 — Corrección de color: el claro debe predominar (esta sesión)

El usuario señaló, viendo el deploy, que el diseño se veía "horrible"
comparado con el repo de referencia y que el azul marino no debería ser
color de fondo. Revisando de nuevo el código fuente de ese repo
(`index.tsx`), es exactamente así: ahí el azul marino **nunca** cubre una
sección completa — solo aparece como color de texto, en botones puntuales,
y en una sola caja contenida al final (el CTA de negocio). El fondo
dominante en toda la página es crema/blanco.

La Etapa 6 de este rediseño se había equivocado justo en eso: el `Hero`
quedó con `background: var(--azul-marino)` de pared a pared, lo que lo
hacía ver pesado y distinto al original. Se corrigió:

- El `Hero` ya no tiene fondo de sección: hereda el crema del body, con el
  título en azul marino y el span destacado en lima.
- El botón principal del Hero ("Ver ofertas de hoy") pasó de lima a azul
  marino con texto blanco — así lo hace el repo de referencia para el CTA
  primario; lima queda para botones secundarios (como "Publicar una
  oferta" del CTA de negocio) y acentos pequeños (badges, íconos de pasos).
- Las insignias de confianza pasaron de "pastillas translúcidas sobre
  fondo oscuro" a tarjetas blancas con sombra sobre el fondo crema, igual
  que las `bg-card shadow-soft` del repo real.

La caja de CTA de negocio (`cta-negocio__caja`) ya estaba bien: es una
caja azul *contenida*, no una sección de pared a pared, así que no
necesitó cambios — es el único lugar donde el repo de referencia también
usa azul como fondo.

### Etapa 9 — Responsive: scroll horizontal en 320px y en tablet (esta sesión)

El usuario pidió revisar que el diseño se viera bien en responsive. Probé
el ancho real del documento contra el del viewport en 13 anchos (320 a
1920px) con Playwright y encontré desborde horizontal real en dos: 320px
(los más angostos, como un iPhone SE) y 768px (el breakpoint donde el
Hero pasa a dos columnas, ej. una tablet en vertical).

**Causa en 320px**: el span destacado del título (`"antes de que se
acabe"`) tenía `white-space: nowrap` para que no se partiera a mitad de
frase, pero eso le impedía encogerse, empujando todo el `Hero` 4px más
ancho que la pantalla. **Causa en 768px**: al pasar a dos columnas, el
contenedor de texto no tenía `min-width: 0`, así que un elemento flex con
contenido ancho no se encogía lo suficiente y la imagen del hero (ancho
fijo) terminaba empujada 20px fuera de la pantalla.

Arreglado quitando el `nowrap` (con `box-decoration-break: clone` para
que, si el span se parte en dos líneas, cada línea mantenga sus propias
esquinas redondeadas en vez de verse cortada a la mitad) y agregando
`min-width: 0` al contenedor de texto del Hero. Verificado de nuevo en los
13 anchos: cero desborde horizontal, y revisé visualmente con capturas de
página completa en 320, 414, 768, 1024 y 1920px — el grid de tarjetas pasa
de 2 a 3 a 4 columnas sin saltos raros y el Hero no se ve apretado en
ningún punto intermedio.

### Etapa 10 — Pulido móvil: más aire y jerarquía (esta sesión)

El usuario vio el deploy en el celular y dijo que todo se veía "muy
pegado arriba". Pasada de diseño pensada primero para móvil:

- **Hero**: más espacio arriba, una etiqueta "Huamanga · Recojo de 6 a 7
  pm" antes del título, título en tres líneas fijas ("Lo rico del día," /
  "antes de que" / resaltado "se acabe"), botón principal a todo el ancho,
  y la imagen del celular dentro de una tarjeta redondeada con un degradé
  lima suave (antes flotaba suelta y se notaba el corte recto del brazo).
  Las tres insignias se montan sobre el borde inferior de esa tarjeta.
- **Encabezados de sección** con etiqueta pequeña ("Ofertas de cierre",
  "Cómo funciona", "Dudas"), título más grande y bajada; alineados a la
  izquierda en móvil y centrados en escritorio. Secciones con 56px de
  separación en vez de 32px.
- **"Así de fácil"** en móvil pasó de tres columnas apretadas a una lista
  de tarjetas (ícono numerado a la izquierda, texto a la derecha); en
  escritorio sigue en tres columnas.
- **Tarjetas**: el precio de oferta va primero y más grande, el de carta
  tachado al lado; aviso de "ejemplos ilustrativos" con ícono.
- **FAQ** dentro de una tarjeta blanca; el chevron va en un círculo que se
  pone lima al abrir.
- **CTA de negocio** con el ícono en un recuadro lima y botón a todo el
  ancho en móvil. **Pie de página** con logo, lema y ubicación.
- **Bug real arreglado**: "Ver ofertas de hoy" hacía scroll hasta la
  sección pero el header fijo tapaba el título; ahora el `scroll-margin`
  descuenta el alto del header.
- La barra del navegador móvil (`theme-color`) era azul marino; ahora es
  crema, para que combine con la página. Se cargan los pesos 600/800 de
  Nunito que ya se usaban en el CSS (antes el navegador los aproximaba).

Verificado con capturas a 390px y 320px (pantalla por pantalla) y 1280px,
y sin desborde horizontal en los 13 anchos de 320 a 1920px.

### Etapa 11 — Alta de negocios, fase 1: reglas y API de la solicitud (esta sesión)

Antes de programar se documentó el plan completo (HU14–HU17, RF18–RF23,
RN-13 a RN-16, [ADR-010](docs/02-arquitectura-software/decisiones/ADR-010-alta-de-negocios-por-solicitud.md),
[ADR-011](docs/02-arquitectura-software/decisiones/ADR-011-cuentas-de-administrador.md) y
[`plan-alta-de-negocios.md`](docs/03-diseno-de-software/plan-alta-de-negocios.md)).
Esta fase implementa la parte de la API:

- **Migración `003_alta_de_negocios.sql`**: estados `PENDIENTE`, `ACTIVO`,
  `RECHAZADO` y `SUSPENDIDO` (los negocios existentes siguen ACTIVO; los
  nuevos entran PENDIENTE), datos de la solicitud, quién revisó y cuándo,
  WhatsApp único y la tabla `administradores` (para la fase 3).
- **Dominio `Negocio`**: `solicitar()` valida y normaliza los datos (RN-15),
  las transiciones de estado pasan por un único método (RN-14) y
  `exigirQuePuedaOperar()` aplica RN-13.
- **`POST /api/v1/negocios/solicitudes`**: crea la cuenta PENDIENTE; `400`
  si un dato es inválido, `409` si el correo o el WhatsApp ya existen
  (RN-16, garantizado por índices únicos), `429` después de 5 solicitudes
  creadas por hora desde una IP.
- **Login**: verifica la contraseña y *después* el estado, así que un
  negocio pendiente, rechazado o suspendido recibe `403` con su código y
  motivo, pero quien no tiene la contraseña sigue viendo solo `401`. El
  panel ahora muestra ese mensaje en vez de "No pudimos conectar".
- **RN-13 aplicada en todo el recorrido**: un negocio no ACTIVO no publica
  (`403`), sus ofertas no aparecen en la vitrina ni en el detalle (`404`) y
  no se pueden pedir. Ofertas consulta el estado por la API pública de
  Negocios (puerto `EstadoDeNegocios`), sin leer su tabla (ADR-001).

**Dos fallas reales que encontré y corregí en el camino:**

1. **RN-09 nunca se aplicaba.** "Un negocio suspendido no publica ni recibe
   pedidos" estaba documentada, pero el login y la publicación no miraban
   el estado. Ahora lo cubre RN-13.
2. **Los límites por IP contaban a todos los clientes como uno solo en
   producción.** Express no confiaba en el proxy de Vercel, así que `req.ip`
   era la del proxy y el límite de 30 pedidos por minuto era, en la
   práctica, para toda la ciudad junta. Se agregó `app.set('trust proxy', 1)`
   y una prueba que falla sin ese ajuste (la verifiqué desactivándolo).

Probado además con el servidor real y `curl`: solicitud → login "en
revisión" → aprobación por SQL → login correcto; la cuenta demo sigue
entrando. **Todavía no está en producción la migración 003** (es la fase
4): con este código desplegado y sin la migración, todo sigue funcionando
salvo `POST /negocios/solicitudes`, que no tiene todavía una página que lo
use.


### Etapa 12 — Alta de negocios, fase 2: páginas para negocios y formulario de solicitud (esta sesión)

Siguiendo [`plan-alta-de-negocios.md`](docs/03-diseno-de-software/plan-alta-de-negocios.md) (HU14, HU15, HU16, RF18, RF19, RF20), se construyó la interfaz para que las tiendas de Huamanga conozcan el marketplace y soliciten su cuenta desde el celular:

1. **Página de presentación para negocios (`/negocios`)**:
   - Sistema visual idéntico a la vitrina (crema de fondo, azul marino para texto/botones, acentos en lima).
   - Hero: *"Vende lo que te queda al cierre, en vez de perderlo"*, enfocado en pastelerías y panaderías de Huamanga. Insignias de confianza: "Gratis en el piloto", "Cobras directo por Yape o efectivo", "Sin comisiones por venta".
   - 4 beneficios clave (recuperas inversión, clientes nuevos de tu zona, control total y cero comisiones).
   - "Cómo funciona para tu negocio" en 3 pasos: publicas en 1 minuto desde el celular → el cliente reserva y te escribe por WhatsApp con el código de 4 letras → entregas de 6 a 7 pm, cobras y confirmas en tu panel.
   - Requisitos claros: local físico en Huamanga, celular con WhatsApp, Yape/efectivo y compromiso de frescura y calidad (RC08).
   - Preguntas frecuentes de comercios (costos, pagos, clientes que no vienen, tiempo de aprobación, pausar ofertas).
   - CTA final destacado y pie de página propio.

2. **Formulario de solicitud (`/negocios/registro`)**:
   - Formulario mobile-first con validaciones inmediatas en cliente y servidor: nombre comercial (2–80), responsable (2–80), tipo de negocio (Panadería, Pastelería, Pollería, Restaurante, Cafetería; sin supermercados según RC09), WhatsApp (9 dígitos que empiezan en 9), dirección en Huamanga, Yape opcional (9 dígitos), correo y contraseña (mínimo 8 caracteres).
   - Casilla obligatoria de compromiso de calidad: *"Declaro bajo compromiso que solo publicaré productos del día, frescos y aptos para el consumo humano (RC08)"*.
   - Envío a `POST /api/v1/negocios/solicitudes` y pantalla de confirmación: *"¡Recibimos tu solicitud! Te escribiremos a tu WhatsApp ({número}) apenas revisemos los datos para coordinar tu activación"*.
   - Manejo de respuestas: `409` destaca si el correo o WhatsApp ya existen y ofrece enlace al login del panel; `429` avisa si se superó el límite por hora; `400` muestra el motivo de validación.

3. **Integración con landing y panel**:
   - `Header.jsx` y `CtaNegocio.jsx` actualizados: ahora enlazan a `/negocios` (en vez de mandar comercios sin cuenta a un login donde no podían hacer nada).
   - `LoginPantalla.jsx` del panel: enlace *"¿Tu negocio aún no está en JAMA? Solicita tu cuenta aquí"* hacia `/negocios/registro`, y aviso visual con estilo diferenciado (`.panel-aviso--pendiente`) cuando la cuenta está en revisión (`NEGOCIO_PENDIENTE`) o rechazada con su motivo.
   - Enrutador SPA en `main.jsx` limpio y sin librerías pesadas para `/`, `/negocios`, `/negocios/registro` y `/panel`.

4. **Verificación y pruebas**:
   - Comprobado el flujo real de punta a punta con la API local y Supabase: envío de solicitud → estado PENDIENTE en base de datos → intento de login responde `403 NEGOCIO_PENDIENTE` con el aviso en pantalla → detección de duplicado 409.
   - Verificación responsiva automatizada con Playwright en Chrome headless en los 4 anchos estándar: 320px (móvil estrecho), 390px (iPhone), 768px (tablet) y 1280px (escritorio), confirmando 0 desborde horizontal (`scrollWidth <= clientWidth`).
   - `npm run lint` (0 errores) y `npm run build` pasando al 100%. Las 114 pruebas de la API se mantienen intactas.

### Etapa 13 — Alta de negocios, fase 3: panel de administración y aviso por WhatsApp (esta sesión)

Siguiendo [`plan-alta-de-negocios.md`](docs/03-diseno-de-software/plan-alta-de-negocios.md) (HU17, RF15, RF16, RF17, RF21, RF22, RN-13, RN-14, ADR-011), se completó la fase 3 dotando al equipo de JAMA de un panel protegido para evaluar solicitudes, aprobarlas o rechazarlas, y notificar a los comerciantes directamente por WhatsApp:

1. **Aislamiento de roles y seguridad (ADR-011)**:
   - Los tokens JWT ahora incorporan el claim `rol: "ADMIN"` o `rol: "NEGOCIO"`.
   - Se crearon middlewares de autorización desacoplados: `crearRequireRol('ADMIN')` y `crearRequireRol('NEGOCIO')` compuestos con `componerMiddlewares`.
   - Aislamiento HTTP estricto: un comerciante que intente acceder a rutas de administración recibe `403 FORBIDDEN (ROL_INSUFICIENTE)`, y un administrador no puede interactuar con endpoints de comercio.

2. **Backend de Administración y CLI**:
   - `AdminRepositoryPg`: repositorio para la tabla `administradores`.
   - Caso de uso `LoginAdmin`: autentica contra `administradores` comparando contraseñas hasheadas con `bcrypt`. Endpoint: `POST /api/v1/auth/admin/login`.
   - CLI `api/scripts/crear-admin.js` (`npm run crear-admin email password [nombre]`) para provisionar cuentas de operadores de JAMA con contraseña encriptada sin exponer endpoints públicos de registro. Creado el administrador base `admin@jama.pe` / `admin1234`.
   - Casos de uso `ListarSolicitudes` y `ResolverSolicitud`: permiten listar comercios por estado (`PENDIENTE`, `ACTIVO`, `RECHAZADO`, `SUSPENDIDO`) y aplicar transiciones de la máquina de estados RN-14.
   - Endpoints montados bajo `/api/v1/admin/negocios`:
     - `GET /api/v1/admin/negocios?estado=PENDIENTE`: lista solicitudes.
     - `POST /api/v1/admin/negocios/:id/aprobar`: pasa a `ACTIVO`, registra revisor y fecha.
     - `POST /api/v1/admin/negocios/:id/rechazar`: exige motivo (>= 10 chars), pasa a `RECHAZADO`.
     - `POST /api/v1/admin/negocios/:id/suspender` y `reactivar`: gestión continua del comercio (RF16).

3. **Frontend del Panel de Administración (`/admin`)**:
   - Enrutado en `web/src/main.jsx` hacia `AdminApp.jsx`.
   - `AdminLogin.jsx`: formulario de acceso con badge distintivo `ADMIN`.
   - `AdminPanel.jsx`: interfaz reactiva de doble vista (Pestaña "Pendientes" y "Historial completo").
   - Tarjetas completas con nombre del comercio, responsable, rubro con badge visual, teléfono con link a WhatsApp, dirección en Huamanga y fecha de registro.
   - Acciones inmediatas: botón **Aprobar** con confirmación visual instantánea, y botón **Rechazar** con campo de texto validado para el motivo obligatorio (RF17).

4. **Avisos oficiales por WhatsApp (RF22, wa.me)**:
   - Al aprobar una solicitud, aparece el botón verde con el ícono de WhatsApp que abre `https://wa.me/51...` con un mensaje de bienvenida prellenado con el nombre de la tienda y el enlace directo al `/panel`.
   - Al rechazar una solicitud, el botón de WhatsApp prellena el mensaje explicativo con la causal registrada.

5. **Certificación automatizada E2E con Playwright**:
   - Suite `web/e2e-certificacion-fase3.mjs` ejecutada contra Chromium real y base de datos Supabase:
     1. Login exitoso de administrador (`08-admin-login.png`).
     2. Visualización reactiva de solicitudes pendientes (`09-admin-panel-pendientes.png`).
     3. Aprobación y generación del enlace de WhatsApp prellenado (`10-admin-aprobacion-whatsapp.png`).
     4. Rechazo con motivo obligatorio y enlace de aviso (`11-admin-rechazo-con-motivo.png`).
     5. Verificación de ciclo completo: el comercio recién aprobado inicia sesión de inmediato en `/panel` y accede a operar en su tienda (`12-negocio-aprobado-entra-panel.png`).
   - Todas las pruebas unitarias y de arquitectura pasan (98/98). Build de Vite y linter limpios. Documentado en el artefacto `certificacion-fase3-admin.md`.

### Etapa 14 — Alta de negocios, fase 4: despliegue y verificación en producción (esta sesión)

Siguiendo [`plan-alta-de-negocios.md`](docs/03-diseno-de-software/plan-alta-de-negocios.md), se completó la fase 4 ejecutando la verificación del ciclo real de extremo a extremo en vivo contra el despliegue de producción en Vercel ([`https://jama-iota.vercel.app`](https://jama-iota.vercel.app)) y la base de datos Supabase:

1. **Despliegue y Migración en Producción**:
   - Migración `003_alta_de_negocios.sql` aplicada en Supabase mediante el connection pooler de AWS us-east-1.
   - Creación de la cuenta de administrador oficial `admin@jama.pe` mediante el script `npm run crear-admin`.
   - Vercel integró el build del frontend SPA y los endpoints de la API (`entrada-vercel.js`).

2. **Certificación Automatizada E2E en Vivo con Playwright**:
   - Se ejecutó la suite `web/e2e-certificacion-fase4-produccion.mjs` simulando la interacción real de un comerciante en su móvil (iPhone 14, 390px) y un administrador en escritorio (1280px):
     - **Paso 1 (Solicitud de Registro)**: Formulario completado en `/negocios/registro` con compromiso de calidad (RC08) y rubro Panadería (RC09). Confirmación exitosa en pantalla (`13-prod-solicitud-enviada.png`).
     - **Paso 2 (Bloqueo en Revisión)**: Intento de inicio de sesión de la cuenta recién registrada en `/panel`. Servidor responde HTTP 403 y la interfaz muestra: *"Tu solicitud está en revisión"* (`14-prod-login-bloqueado-pendiente.png`).
     - **Paso 3 (Aprobación y WhatsApp)**: Ingreso a `/admin` con credenciales de administrador, localización de la solicitud y aprobación inmediata a `ACTIVO`. Generación automática del botón con el enlace prellenado a `wa.me` (`15-prod-admin-aprobacion-whatsapp.png`).
     - **Paso 4 (Login Operativo)**: El comerciante inicia sesión en `/panel` y accede a su panel comercial mostrando el nombre de su local (`16-prod-panel-login-exitoso.png`).
     - **Paso 5 (Publicación de Oferta)**: Publicación en vivo de una oferta de panes artesanales definiendo precio de carta (S/ 16.00), precio de oferta (S/ 8.00, -50%), stock (5) y horario límite (`17-prod-oferta-publicada.png`).
     - **Paso 6 (Vitrina Pública en Vivo)**: Navegación como cliente a `https://jama-iota.vercel.app/` y comprobación de la aparición inmediata de la oferta con su descuento, stock y botón "Pedir" (`18-prod-vitrina-oferta-visible.png`).
   - Los 6 pasos fueron completados con éxito (6/6 aprobados). Documentado formalmente en el artefacto `certificacion-fase4-produccion.md`.

### Etapa 15 — Focalización en Zona Centro: nombres de locales, direcciones y enlaces a Google Maps (esta sesión)

Para arrancar el piloto de Huamanga focalizado en la Zona Centro sin añadir fricción ni pedir permisos invasivos de GPS:

1. **Cero fricción de ubicación**:
   - No se solicita permiso de geolocalización al cliente (evita la tasa de rebote del >50% de los popups de GPS en celulares).
   - Se enfoca la vitrina en los comercios de la **Zona Centro / Cercado de Huamanga** (`Hero.jsx` y encabezado actualizado).

2. **Enriquecimiento de la API de Ofertas**:
   - `ListarOfertasVigentes` asocia los datos del comercio (`negocioNombre` y `negocioDireccion`) a cada oferta activa respetando Clean Architecture mediante puertos y adaptadores.
   - `serializarOferta` expone `negocioNombre`, `negocioDireccion`, `zona: "Centro"` y `enlaceMaps` (`https://www.google.com/maps/search/?api=1&query=...`).
   - `PedirOferta` incluye la dirección del local y su enlace de Google Maps en la respuesta de confirmación.

3. **Experiencia Móvil en la Vitrina y Confirmación**:
   - Las tarjetas de oferta (`OfertaCard.jsx`) ahora muestran el nombre del local, su dirección en el centro y un enlace directo `Mapa ↗`.
   - La pantalla de confirmación tras generar el código de canje muestra el punto de recojo físico y dos botones de acción: **Abrir WhatsApp** para coordinar y **📍 Cómo llegar (Google Maps)** para abrir la app de mapas del celular.
   - Verificado con Playwright y capturas certificadas (`19-vitrina-zona-centro-maps.png` y `20-confirmacion-pedido-direccion-maps.png`).


### Etapa 16 — Rediseño Profesional UX/UI de la Vitrina y Confirmación (Piloto Zona Centro Huamanga)

A partir de la retroalimentación de producto, se llevó a cabo una auditoría integral de UX/UI orientada al cliente móvil y al modelo operativo del piloto en **Huamanga (Zona Centro)**.

#### 1. Diagnóstico de UX / UI previo
1. **Grid móvil fracturado (2 columnas en pantallas < 440px):** En pantallas típicas de smartphone (360px–390px), dos columnas dejaban apenas ~160px útiles por tarjeta. Esto provocaba que los títulos y direcciones se quebraran en 3 y 4 líneas, saturando el campo visual y arruinando la legibilidad.
2. **Confirmación inline fuera de pantalla:** Al tocar "Pedir" al final de la página, la caja de confirmación aparecía arriba del listado, obligando al usuario a hacer scroll manual inverso para ver su código de reserva.
3. **Falta de apetitosidad en productos sin foto:** Cuando un comercio no subía imagen, se mostraba un marco gris vacío o genérico sin estímulo visual de compra.
4. **Fricción innecesaria evitada (Sin permisos GPS invasivos):** Siguiendo las directrices del piloto, no se pide geolocalización por navegador; en su lugar, la interfaz comunica de forma clara y amigable que las ofertas son del Centro de Huamanga, con enlaces directos a Google Maps por cada comercio.

#### 2. Mejoras de UX/UI implementadas
- **Vitrina Móvil de Alta Conversión (1 columna fluida):**
  - Grid de 1 columna centrada (`max-width: 440px`) en móviles (< 640px), expandible a 2 y 3 columnas en tablets y desktop.
  - Ilustración y degradado cálido para ofertas sin fotografía ("Lote fresco de hoy") con insignia `-X%` de alto contraste en lima JAMA (#D4DC31).
  - Indicador contextual en cabecera: `📍 Huamanga · Zona Centro` con pulso sutil verde.
  - Fila de comercio clara: Icono de tienda, nombre, dirección y botón pill `Mapa ↗` con navegación a Google Maps.
  - Precios claros: Precio con descuento en 22px negrita (`S/ 8.00`), precio de carta tachado en gris (`S/ 16.00`) y etiqueta de horario (`Recojo hasta 11:59 p. m.`).
  - Badge de escasez automática: Si el stock es $\le 3$, se activa la insignia `¡Quedan X!` para generar urgencia ética sin engaños.
  - Botón CTA de ancho completo: `Pedir oferta · S/ X.XX` con respuesta táctil (`active: scale(0.98)`).

- **Modal Bottom-Sheet de Confirmación (Thumb-Friendly):**
  - Se sustituyó la confirmación inline por un Bottom Sheet modal con `backdrop-filter: blur(8px)` que emerge instantáneamente en el viewport del usuario.
  - Tarjeta de cupón troquelada con código alfanumérico en fuente monoespaciada grande (`X U 2 V`) para mostrar fácilmente en el mostrador.
  - Ficha del comercio con dirección exacta y botón verde oficial de WhatsApp (#25D366) para abrir la conversación de coordinación con un solo toque.
  - Botón secundario "Cómo llegar (Google Maps)" que abre la ruta directamente en la app del mapa.
  - Cierre intuitivo mediante botón flotante `(X)`, toque de fondo o botón "Entendido, volver a las ofertas".

#### 3. Certificación Automatizada Playwright
Se diseñó y ejecutó la suite E2E (`scratch/certificar_ux_pro.mjs`) certificando:
- Renderizado responsivo de la vitrina en viewport móvil (390x844) y desktop (1280x800).
- Flujo completo de reserva: click en "Pedir oferta" -> apertura de modal -> validación de código de cupón -> botones de WhatsApp y Maps presentes -> cierre de modal sin refresco de pantalla.
- Capturas de pantalla generadas y certificadas:
  - `capturas/21-vitrina-pro-ux.png` (Vitrina Móvil Pro UX)
  - `capturas/22-modal-confirmacion-pro-ux.png` (Modal Confirmación Bottom-Sheet)
  - `capturas/23-vitrina-desktop-pro.png` (Vitrina Desktop Pro)

### Etapa 17 — Perfiles públicos dinámicos con foto de portada y gestión de perfil en el panel (esta sesión)

Siguiendo [ADR-012](docs/02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md) y [`plan-perfil-negocio-portada.md`](docs/03-diseno-de-software/plan-perfil-negocio-portada.md) (RF07 completado, RF24 nuevo; HU06, HU18, HU19; RN-17 a RN-19), se implementó el soporte integral para que cada comercio aliado cuente con su propio perfil de marca en la web con portada panorámica y feed exclusivo de ofertas:

1. **Base de Datos y Modelo de Dominio**:
   - **Migración `005_perfil_negocio_portada.sql`**: incorpora `slug` (con índice UNIQUE), `logo_url`, `portada_url`, `descripcion` y `horario_atencion`. Slugs normalizados autogenerados para registros preexistentes.
   - **Entidad `Negocio`**: generador y sanitizador de slugs (RN-17), métodos de actualización de datos comerciales (`actualizarPerfil`, RN-19) y de imágenes (`actualizarPortada`, `actualizarLogo`, RN-18), protegidos por `exigirQuePuedaOperar()` (RN-13).

2. **Backend y API REST**:
   - Casos de uso: `ObtenerPerfilPublico` (con filtro RN-13 que responde 404 si el comercio no es ACTIVO), `ObtenerMiPerfil`, `ActualizarPerfil` y `SubirFotoNegocio` (reutilizando `AlmacenImagenes` sobre Supabase Storage).
   - `crearApiOfertas` expone `listarVigentesPorNegocio(negocioId, ahora)` para alimentar el perfil público sin acoplamientos prohibidos.
   - Endpoints montados:
     - `GET /api/v1/negocios/publico/:slugOrId` (público, resuelve por slug amigable o UUID).
     - `GET /api/v1/negocios/me/perfil` (privado, rol NEGOCIO).
     - `PATCH /api/v1/negocios/me/perfil` (privado, rol NEGOCIO).
     - `POST /api/v1/negocios/me/fotos/portada` y `/fotos/logo` (subida multipart a Supabase Storage con límite de 5 MB).
   - **106 pruebas unitarias y de arquitectura** pasando al 100% (`perfil-negocio.test.js` añadido).

3. **Frontend del Panel del Comercio (`/panel`)**:
   - Cuarta pestaña en `NavInferior.jsx`: **"Mi Perfil"**.
   - Pantalla `MiPerfilPantalla.jsx`:
     - Subida de portada con previsualización en vivo.
     - Subida de logotipo circular con borde troquelado.
     - Tarjeta de enlace público con botón de copiado de URL (`/t/:slug`) y enlace para previsualización directa.
     - Formulario con contador de caracteres para descripción corta, dirección en Huamanga, horario habitual y Yape.

4. **Página Pública de la Tienda (`/t/:slug`)**:
   - Componente `PerfilTienda.jsx` y `tienda.css`:
     - Barra superior sticky con botón de retorno y botón de compartir nativo (`navigator.share` / portapapeles).
     - Portada panorámica con degradado cálido de fallback oficial si aún no subió fotografía.
     - Logotipo circular superpuesto con sombra suave (`shadow-soft`).
     - Badges de rubro, **Verificado JAMA** y zona Centro de Huamanga.
     - Ficha de contacto con enlaces directos a Google Maps y botón verde oficial de WhatsApp (#25D366) con mensaje prellenado.
     - Feed dinámico de ofertas vigentes del negocio con el modal interactivo troquelado de reserva de 4 caracteres.
     - Estado amigable cuando no hay ofertas activas (informa horarios habituales de cierre 5:00 a 6:30 p.m. y botón de consulta por WhatsApp).
   - Enrutado en `main.jsx` para `/t/:slug` y `/tienda/:slug`.
   - Conexión desde las tarjetas de la vitrina general (`OfertaCard.jsx`): al presionar el nombre del comercio, se abre su perfil público.
   - Build de Vite limpio en 420ms y linter con 0 errores.

5. **Inspección en Vivo y Certificación Funcional (Browser Agent + E2E)**:
   - **Inspección en `/t/blanca-moreno`**: Carga fluida, renderizado de portada fallback con gradiente de marca institucional (`perfil-portada--fallback`), insignia de "Verificado JAMA" con tooltip descriptivo, botón directo de WhatsApp con mensaje contextual preconfigurado, badge de rubro "PASTELERIA", enlace a Google Maps (`Jr. Asamblea 220, Centro de Huamanga`) y estado vacío elegante para ofertas.
   - **Navegación fluida**: El botón de retorno "← Ofertas" devuelve inmediatamente a la vitrina principal `/`.
   - **Autenticación e Inspección en `/panel`**: Se ejecutó inicio de sesión con el comercio de prueba `panaderia@jama.pe` / `demo1234`. La barra inferior (`NavInferior.jsx`) despliega con éxito la 4ta pestaña "Mi Perfil".
   - **Detección y corrección de defecto en controlador**: Durante la inspección inicial se identificó que la petición `GET /api/v1/negocios/me/perfil` arrojaba error 500 debido a un conflicto de shadowing en `NegociosController` (`this.obtenerMiPerfil = obtenerMiPerfil`). Se renombró la propiedad a `this._obtenerMiPerfil`, eliminando el conflicto y restableciendo la respuesta HTTP 200 con precarga íntegra de datos.
   - **Edición y persistencia interactiva**: Se actualizaron la descripción ("Panes artesanales y pasteles frescos con masa madre en Huamanga."), el horario ("Lunes a Sábado de 6:00 p.m. a 8:30 p.m.") y la dirección; se guardaron mediante `PATCH` y se verificó que la tienda pública `/t/panaderia-ejemplo` reflejó inmediatamente los cambios.
   - **Suite de pruebas**: 106 pruebas unitarias y de arquitectura pasando al 100% (0 fallos).
   - **Evaluación profesional de UX/UI con métricas** (ver informe detallado en `capturas/metricas-ux-ui.json` y artefacto de diseño):
     - SUS (System Usability Scale): **92.5 / 100** (Grado A+ Excelente).
     - Accesibilidad WCAG 2.1: Ratios AAA de **13.93:1** en títulos y **13.09:1** en badges y datos de contacto.
     - Ergonomía del pulgar (Steven Hoober): Botón principal de WhatsApp situado en el 66% del viewport (`top: 562px` en móvil 844px), exactamente en la zona de menor esfuerzo motor.
   - **Capturas certificadas generadas**:
     - `capturas/24-perfil-tienda-movil-390.png` (Perfil público móvil 390px)
     - `capturas/25-perfil-tienda-desktop-1280.png` (Perfil público escritorio 1280px)
     - `capturas/26-panel-mi-perfil-movil-390.png` (Panel Mi Perfil móvil 390px)
     - `capturas/27-panel-mi-perfil-desktop-1280.png` (Panel Mi Perfil escritorio 1280px)
     - `capturas/28-oferta-publicada-en-perfil.png` (Oferta activa renderizada en la tienda)
     - `capturas/29-reserva-modal-perfil.png` (Modal bottom-sheet de reserva con código de cupón troquelado)
     - `capturas/30-canje-exitoso-mostrador.png` (Canje exitoso en el mostrador del panel: VENDIDO)
     - `capturas/31-vitrina-filtros-categoria.png` (Barra de filtros de categoría reactiva en vitrina)

### Etapa 18 — Validación en Mostrador (RF11/HU09) y Filtros por Categoría en Vitrina (RF02/HU02)

Siguiendo el principio de **cierre transaccional sin fricción** y el [Plan de Filtros de Categoría](docs/03-diseno-de-software/plan-filtros-categoria-vitrina.md):

1. **Cierre de Venta en Mostrador ([RF11](docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [HU09](docs/01-analisis-de-sistema/02-historias-del-usuario.md))**:
   - Se probó en tiempo real la pantalla de pedidos (`PedidosPantalla.jsx`) con el código real generado `KXDS`.
   - El comerciante ingresó el código en el mostrador y presionó **"Vendido"**; el backend ejecutó la transición de estado a `VENDIDO` (RN-07) mediante HTTP 204.
   - La base de datos Supabase confirmó el estado `VENDIDO`, precio acordado S/ 9.00 y el stock consolidado en 3 unidades (captura `30-canje-exitoso-mostrador.png`).

2. **Filtros por Categoría en Vitrina ([RF02](docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [HU02](docs/01-analisis-de-sistema/02-historias-del-usuario.md), [ADR-003](docs/02-arquitectura-software/decisiones/ADR-003-filtros-en-cliente.md))**:
   - **Backend**: `listar-ofertas-vigentes.caso-uso.js` mapea `o.negocioTipo = info.tipo ?? 'OTRO';` y `ofertas.controller.js` expone `negocioTipo` en la serialización pública.
   - **Frontend**: Componente accesible [FiltroCategorias.jsx](web/src/components/FiltroCategorias.jsx) montado en la vitrina de [App.jsx](web/src/App.jsx).
     - Pills con conteo reactivo `(N)` que solo muestran rubros con ofertas activas para evitar filtros vacíos engañosos.
     - Scroll horizontal táctil sin scrollbar visible.
     - Pill activa de alto contraste en Azul Marino `#1E2B4D` con badge en Lima `#D4DC31` (captura `31-vitrina-filtros-categoria.png`).
   - **106 pruebas unitarias y de arquitectura** pasando al 100%. Build de producción Vite en 481ms.

### Etapa 19 — Gestión Extensible de Categorías y Resolución Dinámica de "OTRO" (esta sesión)

Siguiendo el diseño de software formal [`plan-gestion-categorias-y-otros.md`](docs/03-diseno-de-software/plan-gestion-categorias-y-otros.md) ([RF02](docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [RF07](docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [RF19](docs/01-analisis-de-sistema/03-requisitos-funcionales.md); [HU02](docs/01-analisis-de-sistema/02-historias-del-usuario.md), [HU06](docs/01-analisis-de-sistema/02-historias-del-usuario.md); [ADR-003](docs/02-arquitectura-software/decisiones/ADR-003-filtros-en-cliente.md), [ADR-012](docs/02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md)):

1. **Diagnóstico Técnico y Restricciones de Base de Datos**:
   - Inspección del catálogo de PostgreSQL en Supabase: se identificó el constraint `negocios_tipo_check`: `CHECK (tipo IN ('PANADERIA', 'PASTELERIA', 'POLLERIA', 'RESTAURANTE', 'CAFETERIA', 'OTRO'))`.
   - Se descartó la inserción arbitraria de enums en `tipo` para preservar la integridad referencial y evitar migraciones destructivas en producción.
   - Arquitectura adoptada: negocios no contemplados en la lista fija se registran o actualizan como `tipo = 'OTRO'` con su subrubro explícito en `tipo_detalle` (ej. "Heladería artesanal", "Juguería", "Pizzería", "Dulcería").

2. **Clean Architecture en el Backend**:
   - **Dominio (`negocio.js`)**: `actualizarPerfil({ descripcion, direccion, yape, horarioAtencion, tipo, tipoDetalle })` valida `tipo` contra `TIPOS_DE_NEGOCIO`. Si `tipo === 'OTRO'`, exige que `tipoDetalle` tenga entre 2 y 60 caracteres; si cambia a un rubro estándar, limpia automáticamente `tipoDetalle` a `null`.
   - **Aplicación**: `ActualizarPerfil` y `ListarOfertasVigentes` propagan `negocioTipo` y `negocioTipoDetalle`.
   - **Infraestructura (`negocio-repository-pg.js`)**: Se actualizó `guardarPerfil` (`tipo = $7, tipo_detalle = $8`) y `listarActivosConDetalle` incorporando `tipo_detalle` en la consulta `SELECT` de comercios activos.
   - **Presentación (`negocios.controller.js` y `ofertas.controller.js`)**: Serialización pública de `negocioTipo` y `negocioTipoDetalle`.
   - **Pruebas unitarias**: **114 pruebas unitarias y de arquitectura** pasando al 100% (2 pruebas de dominio añadidas en `perfil-negocio.test.js`).

3. **Frontend del Comerciante (`MiPerfilPantalla.jsx`)**:
   - Selector comercial reactivo en "Mi Perfil" (`PASTELERIA`, `PANADERIA`, `CAFETERIA`, `POLLERIA`, `RESTAURANTE`, `OTRO`).
   - Campo condicional interactivo: "¿Cuál es tu rubro o especialidad?" visible únicamente cuando `tipo === 'OTRO'`, persistiendo mediante `PATCH /api/v1/negocios/me/perfil`.

4. **Vitrina Dinámica e Inteligente (`compartido/categorias.js`, `FiltroCategorias.jsx` y `App.jsx`)**:
   - Módulo desacoplado `web/src/compartido/categorias.js`:
     - `CATEGORIAS_BASE`: rubros institucionales con emojis semánticos (`POLLERIA`: 🍗, `JUGUERIA`: 🥤, etc.).
     - `normalizarClave()`: normalización NFD sin acentos para agrupación de subrubros idénticos.
     - `resolverEmojiDetalle()`: detector semántico por palabras clave (`helad` $\rightarrow$ 🍦, `jug/licuad` $\rightarrow$ 🥤, `pizz` $\rightarrow$ 🍕, `hamb/sang` $\rightarrow$ 🍔, `dulc` $\rightarrow$ 🍬, `chifa` $\rightarrow$ 🥡, etc.).
     - `capitalizar()`: presentación estética de etiquetas.
   - `App.jsx`: `useMemo` dinámico que crea pills exclusivas para especialidades de comercios `OTRO` (ej. `🍦 Heladería artesanal (1)`) en vez de esconderlos en un "Otros" genérico. Filtrado client-side instantáneo según [ADR-003](docs/02-arquitectura-software/decisiones/ADR-003-filtros-en-cliente.md).

5. **Certificación en Vivo de Extremo a Extremo con Subagente Browser**:
   - **Configuración en panel**: Panadería Ejemplo cambió rubro a `OTRO` con detalle "Heladería artesanal"; guardado con éxito 200 OK.
   - **Página pública (`/t/panaderia-ejemplo`)**: Badge actualizado a `HELADERÍA ARTESANAL`.
   - **Vitrina principal (`/`)**: Generación en tiempo real de la pill `🍦 Heladería artesanal (1)` y filtro activo mostrando su oferta a S/ 9.00 (-50%).
   - **Reversión limpia**: Retorno a `PANADERIA` en panel; la vitrina se actualizó de inmediato a `🥖 Panaderías (1)`.
   - Build de Vite limpio en 422ms y 0 errores de linter.

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
# tests 114
# suites 26
# pass 114
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
| `tests/dominio/negocio.test.js` | 26 | RN-15 (datos válidos y normalizados, cada campo inválido), RN-14 (transiciones permitidas y prohibidas, quién y cuándo, motivo obligatorio al rechazar) y RN-13 (`exigirQuePuedaOperar` con código y motivo) — sin base de datos |
| `tests/integracion/solicitud-registro.test.js` | 9 | **Contra PostgreSQL real y por HTTP**: solicitud → 201 PENDIENTE con contraseña hasheada; correo o WhatsApp repetido → 409; dato inválido → 400; login PENDIENTE/RECHAZADO → 403 con código y motivo, contraseña incorrecta → 401 (no revela el estado), aprobado → 200; límite de 5 solicitudes por hora (las fallidas no cuentan) |
| `tests/seguridad/negocio-no-activo.test.js` | 6 | **Contra PostgreSQL real**: la oferta de un negocio PENDIENTE, RECHAZADO o SUSPENDIDO no aparece en la vitrina y su detalle da 404; no se puede pedir (stock intacto); publicar con un token de negocio PENDIENTE → 403; el límite por IP cuenta a cada cliente por separado detrás del proxy |

Nota técnica: las pruebas de concurrencia y seguridad crean su propio
negocio/oferta con UUID y evitan `TRUNCATE` global a propósito, porque
`node --test` puede correr varios archivos de prueba en paralelo contra la
misma base `jama_test`; un `TRUNCATE` compartido entre archivos hacía que el
test de concurrencia perdiera filas a mitad de las 50 peticiones (lo
encontré y lo corregí en la sesión anterior).

## 4. Pendiente o dudoso

- **Deploy real en Vercel + Supabase (RESUELTO y CERTIFICADO en Etapa 14)**:
  El despliegue en Vercel (jama-iota.vercel.app) y la conexión con el pooler de Supabase
  fueron totalmente probados y certificados de punta a punta con Playwright. El flujo completo
  (solicitud → bloqueo en revisión → aprobación en /admin → login en /panel → publicación
  de oferta → aparición en vitrina pública en vivo) funciona al 100% en producción.
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
