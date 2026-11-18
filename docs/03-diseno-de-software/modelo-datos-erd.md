# Modelo de Datos (ERD · PostgreSQL)

> **Motor:** PostgreSQL 15+ (Supabase · Pooler Transaccional)  
> **Fuente exacta:** Migraciones SQL [`001_init.sql`](../../api/db/migrations/001_init.sql) hasta [`006_redes_sociales_negocio.sql`](../../api/db/migrations/006_redes_sociales_negocio.sql)  
> **Propósito:** Documentar las entidades físicas persistidas en base de datos, sus restricciones ACID, índices parciales y propiedad por módulo (ADR-001, ADR-003).

---

## 1. Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    NEGOCIOS ||--o{ OFERTAS : "publica (negocio_id)"
    NEGOCIOS ||--o{ CODIGOS_CANJE : "recibe (negocio_id)"
    OFERTAS ||--o{ CODIGOS_CANJE : "reserva (oferta_id)"
    ADMINISTRADORES ||--o{ NEGOCIOS : "revisa (revisado_por)"

    NEGOCIOS {
        uuid id PK "gen_random_uuid()"
        text nombre "NOT NULL"
        text slug UK "NOT NULL · idx_negocios_slug"
        text email UK "NOT NULL"
        text password_hash "NOT NULL (bcrypt)"
        text whatsapp UK "NOT NULL · uq_negocios_whatsapp"
        text yape "nullable"
        text direccion "nullable"
        text responsable "nullable"
        text tipo "PANADERIA|PASTELERIA|POLLERIA|RESTAURANTE|CAFETERIA|OTRO"
        text tipo_detalle "nullable (subrubro OTRO)"
        text logo_url "nullable (Supabase Storage)"
        text portada_url "nullable (Supabase Storage)"
        text descripcion "nullable"
        text horario_atencion "nullable"
        text instagram "nullable"
        text facebook "nullable"
        text tiktok "nullable"
        text estado "PENDIENTE|ACTIVO|RECHAZADO|SUSPENDIDO"
        timestamptz declaracion_aceptada_en "nullable (RC08)"
        timestamptz revisado_en "nullable"
        uuid revisado_por "nullable"
        text motivo_estado "nullable"
        timestamptz creado_en "DEFAULT now()"
    }

    OFERTAS {
        uuid id PK "gen_random_uuid()"
        uuid negocio_id FK "REFERENCES negocios(id)"
        text titulo "NOT NULL"
        text descripcion "nullable"
        text foto_url "nullable (Supabase Storage)"
        numeric precio_carta "CHECK > 0"
        numeric precio_oferta "CHECK > 0 y < precio_carta"
        integer stock "CHECK >= 0"
        jsonb tramos_precio "DEFAULT '[]' (RN-11)"
        timestamptz hora_elaboracion "NOT NULL"
        timestamptz hora_limite "NOT NULL"
        text estado "ACTIVA|PAUSADA|AGOTADA|FINALIZADA"
        timestamptz creado_en "DEFAULT now()"
        timestamptz actualizado_en "DEFAULT now()"
    }

    CODIGOS_CANJE {
        uuid id PK "gen_random_uuid()"
        varchar codigo "varchar(4) · UK parcial RESERVADO"
        uuid oferta_id FK "REFERENCES ofertas(id)"
        uuid negocio_id FK "REFERENCES negocios(id)"
        text estado "RESERVADO|VENDIDO|NO_CONCRETADO|EXPIRADO"
        numeric precio "Precio congelado al reservar (RN-11)"
        timestamptz creado_en "DEFAULT now()"
        timestamptz expira_en "NOT NULL (+30 min)"
        jsonb historial "DEFAULT '[]' (Trazabilidad AC07)"
    }

    ADMINISTRADORES {
        uuid id PK "gen_random_uuid()"
        text nombre "NOT NULL"
        text email UK "NOT NULL"
        text password_hash "NOT NULL (bcrypt)"
        timestamptz creado_en "DEFAULT now()"
    }
```

---

## 2. Propiedad por Módulo y Reglas en Base de Datos

De acuerdo con el **Monolito Modular** (ADR-001), cada tabla pertenece exclusivamente a un módulo; ningún módulo consulta directamente tablas de otro módulo fuera de su fachada (`index.js`):

| Tabla | Módulo propietario | Reglas e integridad clave aplicadas en SQL |
|---|---|---|
| `negocios` | **Negocios** | • Unicidad estricta de `email`, `whatsapp` (`uq_negocios_whatsapp`) y `slug` (`idx_negocios_slug`).<br/>• Check de ciclo de vida: `PENDIENTE`, `ACTIVO`, `RECHAZADO`, `SUSPENDIDO` (RN-14).<br/>• Check de rubros permitidos excluyendo supermercados (RC09) y columna `tipo_detalle` para `OTRO` (RN-15).<br/>• Índice `idx_negocios_estado (estado, creado_en DESC)`. |
| `ofertas` | **Ofertas** | • Constraint `precio_oferta_menor_a_carta CHECK (precio_oferta < precio_carta)` (RN-01).<br/>• Constraint `CHECK (stock >= 0)` como barrera última contra sobreventa (ADR-003).<br/>• `tramos_precio` en `jsonb` para descuentos progresivos por hora (RN-11).<br/>• Índices `idx_ofertas_vigencia (estado, hora_limite)` y `idx_ofertas_negocio (negocio_id)`. |
| `codigos_canje` | **Pedidos** | • Índice único parcial `uq_codigos_canje_activo ON codigos_canje (codigo) WHERE estado = 'RESERVADO'` para impedir colisiones simultáneas.<br/>• `precio` congelado al instante de reserva (RN-11).<br/>• `historial` `jsonb` con auditoría completa de transiciones (RESERVADO → VENDIDO / NO_CONCRETADO / EXPIRADO).<br/>• Índices `idx_codigos_canje_negocio`, `idx_codigos_canje_oferta` y `idx_codigos_canje_vencidos`. |
| `administradores` | **Acceso** | • Aislamiento físico de cuentas administradoras respecto a comercios afiliados (ADR-011). |

---

## 3. Historial de Migraciones Ejecutadas

| Archivo | Propósito funcional | ADR / Etapa |
|---|---|---|
| `001_init.sql` | Esquema base: `negocios`, `ofertas`, `codigos_canje` e índices críticos. | ADR-001, ADR-003 |
| `002_panel_y_tramos_precio.sql` | Columna `tramos_precio` en `ofertas` y `precio` congelado en `codigos_canje`. | Etapa 3 (RN-11) |
| `003_alta_de_negocios.sql` | Ciclo `PENDIENTE/ACTIVO/RECHAZADO/SUSPENDIDO`, campos de solicitud y tabla `administradores`. | ADR-010, ADR-011 |
| `004_tipo_negocio_otro.sql` | Ampliación del check de rubro para soportar `OTRO` y columna `tipo_detalle`. | Etapa 15 / RN-15 |
| `005_perfil_negocio_portada.sql` | Columnas `slug`, `logo_url`, `portada_url`, `descripcion`, `horario_atencion` y migración de slugs. | ADR-012 |
| `006_redes_sociales_negocio.sql` | Columnas `instagram`, `facebook` y `tiktok` para perfil público `/t/:slug`. | Etapa 21 |
