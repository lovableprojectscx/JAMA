# Arquitectura inicial del sistema

**Estilo:** arquitectura en **tres capas** (presentación, lógica de negocio y datos), con un backend en forma de **monolito modular** en Node.js/Express, que expone una **API REST** y guarda los datos en **PostgreSQL**.

## Diagrama de arquitectura

```mermaid
flowchart TD

    %% =========================
    %% ACTORES
    %% =========================
    subgraph ACTORES["ACTORES"]
        Cliente["Cliente"]
        Negocio["Negocio"]
        Admin["Administrador"]
    end

    %% =========================
    %% PRESENTACIÓN
    %% =========================
    subgraph PRESENTACION["PRESENTACIÓN"]
        Vitrina["Vitrina pública (web móvil)"]
        Panel["Panel del negocio"]
        PanelAdmin["Panel de administración"]
        API["API REST (Express)"]
    end

    %% =========================
    %% LÓGICA DE NEGOCIO
    %% =========================
    subgraph NEGOCIO["LÓGICA DE NEGOCIO"]
        Usuarios["Usuarios y acceso"]
        Negocios["Negocios y planes"]
        Ofertas["Ofertas"]
        Pedidos["Pedidos y códigos de canje"]
        Reportes["Reportes"]
        Moderacion["Moderación"]
        Scheduler["Tareas programadas (expiración)"]
    end

    %% =========================
    %% DATOS
    %% =========================
    subgraph DATOS["DATOS"]
        BD[("PostgreSQL")]
    end

    %% =========================
    %% SISTEMAS EXTERNOS
    %% =========================
    subgraph EXTERNOS["SISTEMAS EXTERNOS"]
        WA["WhatsApp (wa.me)"]
        Mapas["Mapas y geolocalización"]
        Img["Supabase Storage (imágenes)"]
        Yape["Yape (Concierge centralizado)"]
    end

    %% =========================
    %% FLUJO PRINCIPAL
    %% =========================
    Cliente --> Vitrina
    Negocio --> Panel
    Admin --> PanelAdmin
    Vitrina --> API
    Panel --> API
    PanelAdmin --> API
    API --> NEGOCIO
    NEGOCIO --> BD

    %% =========================
    %% INTEGRACIONES
    %% =========================
    Pedidos -->|"genera enlace comprobante y tienda"| WA
    Vitrina -->|"ubicación del cliente"| Mapas
    Ofertas -->|"subida y CDN fotos"| Img
    Cliente -.->|"transfiere a JAMA (Paso 1)"| Yape
    Admin -.->|"valida Yape y avisa al negocio"| WA

    %% =========================
    %% ESTILOS
    %% =========================
    style ACTORES fill:#222,stroke:#fff,stroke-width:2px,color:#fff
    style PRESENTACION fill:#222,stroke:#fff,stroke-width:2px,color:#fff
    style NEGOCIO fill:#222,stroke:#fff,stroke-width:2px,color:#fff
    style DATOS fill:#222,stroke:#fff,stroke-width:2px,color:#fff
    style EXTERNOS fill:#222,stroke:#fff,stroke-width:2px,color:#fff
```

## Descripción de las capas

| Capa | Pregunta que responde | Componentes |
|---|---|---|
| **Presentación** | ¿Cómo interactúa el usuario? | Vitrina pública (web móvil, sin registro), panel del negocio, panel de administración y la API REST en Express (rutas, controladores y validación de entrada). |
| **Lógica de negocio** | ¿Qué hace el sistema? | Módulos de dominio con sus reglas: usuarios y acceso, negocios y planes, ofertas, pedidos y códigos, reportes, moderación y tareas programadas. |
| **Datos** | ¿Dónde se almacena la información? | PostgreSQL, accedido solo a través de repositorios. Las imágenes viven en un servicio externo; en la base de datos solo se guarda su URL. |

**Regla de dependencia:** cada capa solo llama a la capa inmediatamente inferior. Los controladores no acceden a la base de datos, y los repositorios no contienen reglas de negocio.

## Responsabilidades de los módulos

| Módulo | Responsabilidad | Requisitos | Drivers |
|---|---|---|---|
| **Usuarios y acceso** | Registro e inicio de sesión de negocios y administradores, tokens y control por rol. El cliente navega de forma anónima. | RF17 | DA04 |
| **Negocios y planes** | Perfil del negocio, verificación del precio de carta, ciudad y zona, plan Gratis/Pro y sus límites. | RF07, RF13, RF15 | DA04, DA07 |
| **Ofertas** | Crear, editar, pausar y finalizar ofertas; listado por cercanía y filtros; validar la fecha de vencimiento. | RF01–RF03, RF08–RF10 | DA03, DA05 |
| **Pedidos y códigos de canje** | Generar el código único, reservar el stock en una transacción, construir el enlace `wa.me` y registrar el ciclo de vida del código. | RF04–RF06, RF11 | DA01, DA02, DA06 |
| **Reportes** | Calcular por negocio y por mes los pedidos, las ventas concretadas, la conversión y los clientes nuevos. | RF12 | DA01 |
| **Moderación** | Recibir los reportes de los clientes, resolverlos y suspender negocios. | RF14, RF16 | — |
| **Tareas programadas** | Cada minuto: finalizar las ofertas vencidas o agotadas y liberar las reservas no confirmadas. | RF05, RF10 | DA03 |

## Flujo crítico: pedir una oferta y cobro Concierge (DA01 + DA02 + ADR-013)

```mermaid
sequenceDiagram
    actor C as Cliente
    participant V as Vitrina web / Modal
    participant API as API REST
    participant P as Pedidos y códigos
    participant BD as PostgreSQL
    actor O as Operador JAMA (Admin)
    actor N as Negocio

    C->>V: Toca "Pedir oferta"
    V->>API: POST /api/v1/ofertas/:id/pedidos
    API->>P: PedirOferta.ejecutar(ofertaId)
    P->>BD: BEGIN + SELECT oferta FOR UPDATE
    alt Hay stock y la oferta está vigente
        P->>BD: stock - 1, INSERT código (RESERVADO) + COMMIT
        P-->>API: { codigo, expiraEn, minutosReserva, enlaceWhatsapp, enlaceWhatsappTienda, pago: { yapeNumero, yapeTitular, monto } }
        API-->>V: 201 Created
        V-->>C: Modal 3 Pasos: (1) Yape JAMA, (2) WhatsApp comprobante, (3) Código K7P2
        C->>O: Envía Yape a JAMA y comprobante por WhatsApp
        O->>API: PATCH /api/v1/admin/pedidos/K7P2 (VENDIDO)
        O->>N: Notifica por WhatsApp con pedido pagado y código
        C->>N: Recoge el producto en tienda mostrando código K7P2
    else Sin stock o vencida
        P->>BD: ROLLBACK
        API-->>V: 409 Conflict (oferta agotada)
    end
    Note over P,BD: Si no se confirma en 30 min, la tarea programada<br/>marca el código EXPIRADO y devuelve el stock.
```

## Ciclo de vida del código de canje

```mermaid
stateDiagram-v2
    [*] --> RESERVADO: cliente pide
    RESERVADO --> VENDIDO: negocio o admin confirma (validación Yape)
    RESERVADO --> NO_CONCRETADO: negocio o admin lo rechaza
    RESERVADO --> EXPIRADO: pasan 30 min sin respuesta
    NO_CONCRETADO --> [*]
    EXPIRADO --> [*]
    VENDIDO --> [*]
```

## Decisiones iniciales

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Tres capas con un monolito modular | Microservicios | Hay un solo desarrollador y el volumen es de una ciudad; los microservicios agregan despliegue y comunicación de red sin beneficio en esta etapa (DA08, RC10). |
| PostgreSQL | Base de datos NoSQL | Las transacciones y el bloqueo de fila garantizan que no haya sobreventa (DA02). |
| WhatsApp por enlace `wa.me` | API de WhatsApp Business | Costo cero y sin trámite de aprobación; es suficiente para el MVP (DA06). |
| Flujo Concierge Yape | Pasarela de tarjetas compleja | El pago por Yape es el hábito dominante en Ayacucho y Perú; JAMA centraliza el cobro de cara al cliente y liquida semanalmente a los comercios, reduciendo fricción y asegurando la recaudación (RC06, ADR-013). |
| Tarea programada dentro del backend | Servicio o cola independiente | Es simple y basta para el volumen de una ciudad; puede extraerse después si crece (DA03). |

## Integración con sistemas externos
- **Pedidos y códigos → WhatsApp:** el backend construye el enlace `https://wa.me/<número>?text=<mensaje>` para comprobante a JAMA y aviso a la tienda; sin costos de mensajería API.
- **Vitrina → Mapas y geolocalización:** el navegador obtiene la ubicación aproximada con permiso del cliente o calcula la ruta hacia Google Maps.
- **Ofertas → Almacenamiento de imágenes:** las fotos se suben a Supabase Storage (ADR-007 / ADR-008) y se sirven públicamente; en PostgreSQL solo se guarda la URL pública.
- **Yape:** operado mediante modelo Concierge (ADR-013). La vitrina expone los datos de recaudación de operaciones JAMA, el cliente transfiere y adjunta comprobante, el administrador valida el pedido desde `/admin` y transiciona el código a VENDIDO.
