# JAMA — Marketplace de ofertas de cierre

Plataforma web *mobile-first* para que comercios de comida de Ayacucho (Huamanga: pastelerías, panaderías, pollerías, restaurantes, cafeterías y rubros afines) vendan sus excedentes aptos del día a precio de cierre.

El cliente navega sin registro: explora la vitrina (`/` o el perfil de una tienda en `/t/:slug`), reserva una ración generando un código único de 4 caracteres y sigue el **Modal Concierge en 3 pasos** (pago centralizado vía **Yape a JAMA**, envío de constancia por **WhatsApp** y recojo presencial en tienda con ruta en Google Maps).

La documentación completa de ingeniería (requisitos, drivers, ADRs, ERD y modelo C4) está centralizada en [`docs/README.md`](docs/README.md). Este monorepo implementa la arquitectura con **4 módulos**: **Acceso, Negocios, Ofertas y Pedidos**.

---

## Estructura

```text
api/    Node.js + Express (ESM) · Monolito modular · Clean Architecture · /api/v1
web/    React + Vite · Vitrina, perfiles /t/:slug, /panel y /admin Concierge
docs/   Arquitectura del sistema, Mapa Maestro, ADRs, ERD y Modelo C4
```

---

## Rutas principales de la aplicación web

| Ruta | Audiencia | Propósito |
|---|---|---|
| `/` | Cliente | Vitrina pública de ofertas vigentes con categorías dinámicas y modal Concierge Yape |
| `/t/:slug` | Cliente | Perfil público de cada negocio aliado (portada, logo, redes sociales, mapa y ofertas propias) |
| `/negocios` | Comercio (prospecto) | Landing informativa B2B y propuesta de valor |
| `/negocios/registro` | Comercio (prospecto) | Solicitud de afiliación con declaración jurada de inocuidad (`RC08`) |
| `/terminos` | Público general | Términos y condiciones de uso de la plataforma |
| `/panel` | Negocio (`NEGOCIO`) | Panel móvil del comercio: publicar, editar/republicar ofertas, validar códigos, kit QR y métricas de impacto |
| `/admin` | Operador (`ADMIN`) | Aprobación de solicitudes, validación Concierge de pagos Yape, aviso a tienda y publicación asistida |

---

## Cómo correrlo en local

### 1. Base de datos

Necesitas PostgreSQL (local o proyecto gestionado en Supabase).

```bash
createdb jama
createdb jama_test   # solo si vas a correr las pruebas de integración contra Postgres
```

### 2. API

```bash
cd api
cp .env.example .env     # configura DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JAMA_WHATSAPP, JAMA_YAPE_*
npm install
npm run migrate          # aplica las migraciones 001 a 006
npm run seed             # crea negocio demo: panaderia@jama.pe / demo1234
npm start                # http://localhost:3000
```

### 3. Web

```bash
cd web
cp .env.example .env     # VITE_API_URL y variables VITE_JAMA_*
npm install
npm run dev              # http://localhost:5173
```

### 4. Pruebas

```bash
cd api
npm run test:unit        # 128 pruebas unitarias y de arquitectura (sin base de datos)
npm test                 # suite completa incluyendo concurrencia e integración contra DATABASE_URL_TEST
```

---

## Despliegue en Producción (Vercel + Supabase)

El monorepo está configurado para desplegarse unificadamente en **Vercel** mediante [`vercel.json`](vercel.json) (enrutando `/api/(.*)` al servicio `api` serverless `api/src/entrada-vercel.js`, `/.*` al build estático de `web/`, y ejecutando el Vercel Cron de expiración de reservas en `/api/v1/cron/expirar-reservas`), conectado a **Supabase PostgreSQL (Transaction Pooler)** y **Supabase Storage**.

- **Producción activa:** [jama-web.vercel.app](https://jama-web.vercel.app/)
