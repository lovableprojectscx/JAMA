# ADR-013: Flujo Concierge de cobro centralizado con Yape y publicación asistida

- **Estado:** Aceptada
- **Fecha:** noviembre 2026
- **Drivers:** DA01 (trazabilidad de venta), DA06 (integraciones y pago móvil), RC06 (pago fuera de pasarela bancaria), AC02 (consistencia), AC06 (confiabilidad y confianza)
- **Requisitos:** RF04, RF06, RF11, RF25, RF26 · HU04, HU22, HU23

## Contexto

En la fase inicial de lanzamiento y piloto en Huamanga Centro:
1. **Barrera de pasarelas de pago bancarias:** La integración de una pasarela automatizada por API (como Niubiz, Culqi o MercadoPago) impone comisiones fijas por transacción (3.99% + IGV + costo por operación) y exige que los usuarios cuenten con tarjetas bancarias habilitadas para comercio electrónico, lo que genera fricción innecesaria frente a la adopción masiva de **Yape y Plin** en Ayacucho.
2. **Riesgo crítico de "No-Shows" (inasistencias):** Si el cobro se posterga hasta el mostrador de la tienda ("pago contra entrega"), existe un alto riesgo de que clientes reserven raciones de comida y nunca se presenten a recogerlas, provocando que el comerciante pierda el producto perecible al final del día.
3. **Fricción operativa en el comerciante:** Muchos panaderos, pasteleros y cocineros locales se encuentran ocupados en plena faena durante las horas de la tarde y no disponen de tiempo o familiaridad técnica para ingresar diariamente al panel web a publicar sus excedentes.

## Decisión

Se adopta formalmente el **Modelo Operativo Asistido (Concierge Marketplace)** dividido en tres pilares arquitectónicos:

### 1. Cobro Centralizado con Yape a JAMA
- El cliente reserva en la vitrina pública y se le despliega un modal responsivo de 3 pasos:
  - **Paso 1:** Se presentan los datos oficiales de recaudo de JAMA (`VITE_JAMA_YAPE_NUMERO`, `VITE_JAMA_YAPE_TITULAR`, monto en `S/`) con botón de copiado al portapapeles.
  - **Paso 2:** El cliente presiona el botón verde para enviar su comprobante por WhatsApp a Operaciones JAMA con mensaje prellenado estructurado (`enlaceWhatsapp`) que incluye código, local, oferta y monto.
  - **Paso 3:** Se mantiene visible el código de canje reservado (vigencia de 30 minutos), dirección física en Zona Centro y enlace a Google Maps.

### 2. Validación de Pago y Emisión de Orden en `/admin`
- El operador de JAMA valida el abono en la pestaña **"Pedidos / Canjes Yape"** de `/admin`:
  - Al validar el comprobante, presiona *"Validar pago Yape"*, ejecutando `PATCH /api/v1/admin/pedidos/:codigo` con `{ concretado: true }`.
  - El caso de uso `ResolverPedido` admite la bandera `esAdmin: true`, permitiendo al operador central confirmar el canje a estado `VENDIDO` sin restricción de `negocioId`.
  - El operador dispone de la acción *"Avisar a tienda por WhatsApp"* que genera el mensaje oficial prellenado para autorizar al local la entrega del pedido y asegurar la liquidación de sus fondos.
  - Si el pago no es recibido en el tiempo establecido, el operador puede cancelar la reserva para liberar la unidad de vuelta al stock.

### 3. Publicación Asistida para Comercios (Modelo Híbrido)
- Se implementan los endpoints de administración:
  - `POST /api/v1/admin/negocios/:id/ofertas`
  - `POST /api/v1/admin/negocios/:id/ofertas/fotos`
- El operador de JAMA puede recibir por WhatsApp fotos y descripciones de excedentes enviadas directamente por los comerciantes y publicarlas en 1 minuto desde la pestaña *"Comercios Afiliados"* de `/admin`.
- Este esquema es híbrido: los comerciantes con mayor familiaridad tecnológica pueden seguir publicando autónomamente desde su `/panel`, mientras que los comercios tradicionales cuentan con asistencia continua del equipo de JAMA.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| **Integración directa de pasarela (Niubiz/Culqi)** | Comisiones bancarias elevadas para pedidos de bajo monto (S/ 5–S/ 10), costo de implementación prematuro y menor penetración en el usuario de a pie en Huamanga frente a Yape. |
| **Pago contra entrega en el mostrador del comercio** | Genera un alto riesgo de *no-shows* donde el comerciante aparta la comida y el cliente nunca llega a recogerla, destruyendo la confianza del comercio en JAMA. |
| **Exigir exclusivamente publicación desde el panel del comerciante** | Alta tasa de abandono de comercios por falta de tiempo durante sus horas punta de atención u horneado. |

## Consecuencias

- ✅ **Venta 100% garantizada para la tienda:** La comida solo se despacha cuando JAMA ya recaudó el dinero, eliminando las pérdidas por inasistencia.
- ✅ **Cero costo de pasarela bancaria:** Permite operar con comisiones cero en el piloto de Huamanga.
- ✅ **Inclusión y agilidad comercial:** Los negocios que no usan la plataforma web a diario participan activamente vía WhatsApp.
- ⚠️ **Carga operativa para el equipo de JAMA:** Requiere que el operador valide comprobantes manualmente y liquide periódicamente los fondos acumulados a las cuentas de los comercios. Esta carga es óptima para validar el volumen de 10 a 50 comercios iniciales antes de automatizar la pasarela en una fase posterior.
