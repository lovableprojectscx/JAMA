# 00 · Necesidad del negocio

> Etapa 1 del proceso de arquitectura: **¿qué problema queremos resolver?**

## Problema
Los negocios de comida de Huamanga (pollerías, panaderías y pastelerías) terminan el día con producto apto que no lograron vender. Ese producto ya está pagado (insumos, gas y trabajo) y se bota, se regala o se reparte entre la familia.

- En el Perú se pierden 12,8 millones de toneladas de alimentos al año, el 47,6 % del total disponible (El Comercio).
- Los negocios de comida registran entre 2 % y 20 % de sobreproducción (El Comercio, 2026).
- Publicar en Facebook o en estados de WhatsApp solo llega a quien ya sigue al negocio, y muchos negocios no quieren admitir que tienen merma.

**Caso real:** la pollería familiar del autor tenía días con pollos sobrantes y nadie a quién vendérselos.

## Oportunidad
El modelo ya funciona en Lima (Cirkula, más de 500 mil usuarios) y en México (Cheaf), pero **ninguna plataforma atiende las ciudades del interior del Perú**. Además, esas plataformas obligan a descargar una app y a pagar dentro de ella, mientras que en el Perú se compra por WhatsApp y se paga con Yape.

## Objetivos del negocio

| ID | Objetivo | Indicador | Meta del piloto (4 semanas) |
|---|---|---|---|
| ON01 | Reducir la pérdida de producto de los negocios | Ofertas vendidas / ofertas publicadas | ≥ 60 % |
| ON02 | Llevar clientes nuevos a los negocios | Clientes nuevos por negocio al mes (reporte) | Medible y creciente |
| ON03 | Conseguir negocios afiliados | Negocios que publican gratis (de 15 entrevistados) | ≥ 8 |
| ON04 | Validar la disposición a pagar | Negocios que pagarían S/ 25 al mes | ≥ 4 de 15 |
| ON05 | Generar hábito de compra | Usuarios que compran 2 o más veces | ≥ 25 % |
| ON06 | Poder replicar el modelo en otras ciudades | Tiempo para abrir una ciudad nueva | Solo configuración, sin cambiar código |

## Propuesta de valor

| Para | Valor |
|---|---|
| **Negocio** | Recupera dinero de un producto que iba a perder y gana clientes nuevos, sin dañar su imagen: se habla de "ofertas de cierre", no de "merma". Cuenta con vitrina digital, publicación asistida y perfil propio con kit QR imprimible. |
| **Cliente** | Comida del día con 40 % a 70 % de descuento cerca de él. Sin app ni registro: reserva su código, realiza el pago digital centralizado vía Yape (flujo concierge) y recoge en tienda. |
| **Ciudad** | Menos desperdicio de alimentos y fomento del consumo sostenible de proximidad. |

## Modelo de negocio
Freemium: **Gratis** (1 oferta al día) y **Pro** (S/ 25 al mes: ofertas ilimitadas, posición destacada y reporte de ventas). Durante la fase de validación y piloto, todos los negocios acceden a las capacidades completas (incluyendo publicación asistida y métricas de impacto). En el flujo transaccional inicial, JAMA opera un modelo Concierge de cobro centralizado con Yape y liquidación semanal a los comercios.

## Alcance del sistema (MVP)
- **Incluye:** vitrina pública de ofertas, filtros dinámicos por categoría y búsqueda, perfiles públicos de negocio (`/t/:slug`), kit QR de mostrador imprimible, pedidos con reserva de stock y código de canje único de 4 caracteres, flujo concierge de cobro centralizado con Yape a JAMA y validación en `/admin`, publicación asistida de ofertas desde el panel de administración, panel del negocio con métricas de impacto comercial y ambiental, reporte mensual, verificación y moderación.
- **No incluye:** pasarela de pagos con tarjeta de crédito/débito integrada (se opera con Yape concierge), logística o delivery propio (recojo presencial en tienda del negocio), ni app móvil nativa instalable (SPA/PWA web ultraligera optimizada para móviles).

## Interesados (stakeholders)
Negocios de comida, clientes (estudiantes de la UNSCH y trabajadores del centro), el administrador y fundador, la incubadora UNSCH y entidades reguladoras (Indecopi y municipalidad).

## Cómo se conecta con la arquitectura
```
Necesidad del negocio → Actores → Historias de usuario → Requisitos funcionales
→ Atributos de calidad → Restricciones → Drivers → Decisiones (ADR) → Estilo → Enfoque
```
