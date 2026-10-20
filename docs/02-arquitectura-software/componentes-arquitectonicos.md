# Componentes arquitectónicos

> Etapa 9: **¿qué componentes existen y cómo se relacionan?**
> Estilo: monolito modular en capas ([ADR-001](decisiones/ADR-001-monolito-modular.md)) · Enfoque interno: Clean Architecture ([ADR-002](decisiones/ADR-002-clean-architecture.md))

## Diagrama de componentes

```mermaid
flowchart TB
    CL(["👤 Cliente<br/><small>Persona · compra ofertas sin registrarse</small>"])
    NE(["👤 Negocio<br/><small>Persona · publica ofertas y confirma códigos</small>"])
    AD(["👤 Administrador<br/><small>Persona · verifica y modera</small>"])

    WEB["Aplicación web<br/><small>[Contenedor: SPA React]</small><br/>Vitrina · Panel negocio · Panel admin"]

    subgraph API["API Marketplace — [Contenedor: Node.js + Express · monolito modular]"]
        REST["API REST<br/><small>[Componente: rutas + middlewares]</small><br/>/api/v1 · JWT · validación · rate limiting"]

        subgraph MOD["Módulos de negocio"]
            ACC["Acceso<br/><small>[Componente: módulo]</small><br/>Login, tokens y roles"]
            NEG["Negocios<br/><small>[Componente: módulo]</small><br/>Perfil, verificación, plan, ciudad"]
            OFE["Ofertas<br/><small>[Componente: módulo]</small><br/>Publicar, listar, stock, vigencia<br/>+ caché en memoria"]
            PED["Pedidos<br/><small>[Componente: módulo]</small><br/>Código de canje, reserva, confirmación"]
            REP["Reportes<br/><small>[Componente: módulo]</small><br/>Métricas mensuales"]
            MODR["Moderación<br/><small>[Componente: módulo]</small><br/>Denuncias y suspensiones"]
        end

        JOB["Tarea programada<br/><small>[Componente: node-cron, cada 1 min]</small>"]
    end

    DB[("Base de datos<br/><small>[Contenedor: PostgreSQL]</small>")]

    IMG["Almacenamiento de imágenes<br/><small>[Sistema externo: Cloudinary]</small>"]
    WA["WhatsApp<br/><small>[Sistema externo]</small>"]
    MAP["Mapas / geolocalización<br/><small>[Sistema externo]</small>"]

    CL -->|Usa| WEB
    NE -->|Usa| WEB
    AD -->|Usa| WEB
    WEB -->|"Llama a la API<br/>[HTTPS/JSON]"| REST
    WEB -->|"Abre el chat con el enlace wa.me"| WA
    WEB -->|"Obtiene la ubicación"| MAP

    REST -->|"Invoca casos de uso"| MOD
    REST -.->|"Valida el token"| ACC
    NEG -->|"Crea la cuenta del negocio"| ACC
    OFE -->|"Verifica plan y estado del negocio"| NEG
    PED -->|"Reserva y libera unidades"| OFE
    PED -->|"Obtiene el WhatsApp del negocio"| NEG
    REP -->|"Lee el historial de códigos"| PED
    MODR -->|"Suspende negocios"| NEG
    MODR -->|"Retira ofertas"| OFE
    JOB -->|"Ejecuta ExpirarReservas"| PED

    OFE -->|"Sube fotos [HTTPS/REST]"| IMG
    API -->|"Cada módulo lee y escribe solo sus tablas<br/>[SQL]"| DB

    classDef persona fill:#1e3a5f,stroke:#0f2540,color:#fff
    classDef contenedor fill:#2f6db5,stroke:#1d4f8a,color:#fff
    classDef componente fill:#8fb8e8,stroke:#4a7fbf,color:#0b2340
    classDef externo fill:#9a9a9a,stroke:#6b6b6b,color:#fff
    class CL,NE,AD persona
    class WEB,DB contenedor
    class REST,ACC,NEG,OFE,PED,REP,MODR,JOB componente
    class IMG,WA,MAP externo
```

**Leyenda:** azul oscuro = persona · azul = contenedor · celeste = componente · gris = sistema externo.

**Notas:**
- Cada componente es un módulo del monolito: todos se despliegan juntos.
- Un módulo usa a otro **solo a través de su API pública** (`index.js`), nunca leyendo sus tablas.
- La caché es **en memoria, dentro del módulo Ofertas**, no un contenedor aparte ([ADR-008](decisiones/ADR-008-cache-e-imagenes.md)).
- **Yape** no aparece: el pago ocurre fuera del sistema (RC06).
- El backend **no llama** a WhatsApp: solo construye el enlace `wa.me`, y el navegador del cliente lo abre ([ADR-007](decisiones/ADR-007-integraciones-puertos-adaptadores.md)).

## Responsabilidad de cada componente

| Componente | Responsabilidad | Casos de uso principales | Carpeta en el código |
|---|---|---|---|
| **API REST** | Punto de entrada HTTP: rutas `/api/v1`, autenticación, validación, límite de peticiones y manejo de errores | — | `src/api/` |
| **Acceso** | Identidad y roles (NEGOCIO, ADMIN); el cliente es anónimo | `IniciarSesion`, `RenovarToken` | `src/modulos/acceso/` |
| **Negocios** | Perfil del negocio, verificación del precio de carta, ciudad y zona, plan Gratis/Pro | `RegistrarNegocio`, `VerificarNegocio`, `CambiarPlan` | `src/modulos/negocios/` |
| **Ofertas** | Publicar, editar, pausar y listar ofertas; controlar stock y vigencia | `PublicarOferta`, `ListarOfertasCercanas`, `PausarOferta` | `src/modulos/ofertas/` |
| **Pedidos** | Código de canje, reserva de stock, enlace `wa.me`, confirmación y expiración | `PedirOferta`, `ResolverPedido` (confirmar o rechazar), `ExpirarReservas` | `src/modulos/pedidos/` |
| **Reportes** | Pedidos, ventas, conversión y clientes nuevos por negocio y mes | `GenerarReporteMensual` | `src/modulos/reportes/` |
| **Moderación** | Denuncias de clientes, suspensión de negocios y retiro de ofertas | `ReportarOferta`, `ResolverDenuncia`, `SuspenderNegocio` | `src/modulos/moderacion/` |
| **Tarea programada** | Disparar la expiración cada minuto | — (invoca a Pedidos) | `src/jobs/` |

## Trazabilidad: ¿de qué requisito sale cada componente?

Esta tabla permite responder, para **cualquier caja del diagrama**, por qué existe.

| Componente | Historias de usuario | Requisitos funcionales | Drivers | Decisiones (ADR) | Escenarios de calidad |
|---|---|---|---|---|---|
| **Aplicación web** | HU01–HU13 | RF01–RF03, RF06 | DA05, DA08 | ADR-009 | EQ-01, EQ-05 |
| **API REST** | Todas | RF17 | DA04, DA08 | ADR-001, ADR-006 | EQ-04 |
| **Acceso** | HU06, HU11–HU13 | RF17 | DA04 | ADR-006 | EQ-04 |
| **Negocios** | HU06, HU11, HU12 | RF07, RF13, RF15 | DA04, DA07 | ADR-001 | EQ-08 |
| **Ofertas** | HU01–HU03, HU07, HU08 | RF01–RF03, RF08–RF10, RF13 | DA03, DA05, DA07 | ADR-005, ADR-008 | EQ-01, EQ-06, EQ-08 |
| **Pedidos** | HU04, HU09 | RF04–RF06, RF11 | **DA01, DA02**, DA03, DA06 | **ADR-003, ADR-004**, ADR-005, ADR-007 | **EQ-02**, EQ-06, EQ-07 |
| **Reportes** | HU10 | RF12 | DA01 | ADR-004 | EQ-07 |
| **Moderación** | HU05, HU13 | RF14–RF16 | DA04 | ADR-006 | EQ-04 |
| **Tarea programada** | HU07, HU09 (indirectas) | RF05, RF10 | DA03 | ADR-005 | EQ-06 |
| **PostgreSQL** | — | RF05 | DA02, DA08 | ADR-003 | EQ-02, EQ-07 |
| **Almacenamiento de imágenes** | HU03, HU07, HU11 | RF03, RF08 | DA05, DA06 | ADR-007, ADR-008 | EQ-01 |
| **WhatsApp (enlace)** | HU04 | RF06 | DA06 | ADR-007 | EQ-05, EQ-09 |

**Ejemplo para la exposición:** *"¿Por qué existe el módulo Pedidos separado de Ofertas?"* → Porque la venta ocurre en WhatsApp y hay que rastrearla (DA01, RF04, RF11). Su ciclo de vida, reservado → vendido / no concretado / expirado, es distinto del de la oferta (ADR-004), y es el que abre la transacción concurrente sobre el stock, pidiéndole a Ofertas la reserva a través de su API pública (DA02, ADR-003, EQ-02).
