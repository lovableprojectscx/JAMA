# JAMA — Marketplace de ofertas de cierre

Marketplace para que pastelerías y panaderías de Ayacucho (Huamanga) vendan
sus productos del día a precio de cierre. El cliente no se registra: ve las
ofertas, toca **Pedir**, recibe un código de 4 caracteres y WhatsApp se abre
con un mensaje prellenado para coordinar el pago (Yape) y el recojo
(6:00–7:00 pm). JAMA no cobra ni procesa pagos.

La arquitectura completa (requisitos, drivers, ADRs y modelo C4) está en
[`docs/`](docs/). Este monorepo la implementa para el MVP con 4 módulos:
**Acceso, Negocios, Ofertas y Pedidos**.

## Estructura

```
api/    Node.js + Express (ESM) · monolito modular · Clean Architecture
web/    React + Vite · vitrina pública del cliente
docs/   Arquitectura del sistema (ADRs, C4, requisitos)
```

## Cómo correrlo

### 1. Base de datos

Necesitas PostgreSQL corriendo localmente (o usa el `DATABASE_URL` que
prefieras, por ejemplo un proyecto de Supabase).

```bash
createdb jama
createdb jama_test   # solo si vas a correr las pruebas de integración
```

### 2. API

```bash
cd api
cp .env.example .env     # ajusta DATABASE_URL si hace falta
npm install
npm run migrate          # crea las tablas
npm run seed              # crea un negocio de prueba: panaderia@jama.pe / demo1234
npm start                 # http://localhost:3000
```

### 3. Web

```bash
cd web
cp .env.example .env      # VITE_API_URL debe apuntar a la API
npm install
npm run dev                # http://localhost:5173
```

### 4. Pruebas

```bash
cd api
npm run migrate -- "$DATABASE_URL_TEST"   # aplica el esquema también a jama_test
npm test
```

Ver [`REPORTE.md`](REPORTE.md) para el detalle de qué prueba cada suite y el
resultado de la última corrida.
