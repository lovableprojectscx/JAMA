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
| **Negocio** | Recupera dinero de un producto que iba a perder y gana clientes nuevos, sin dañar su imagen: se habla de "ofertas de cierre", no de "merma". |
| **Cliente** | Comida del día con 40 % a 70 % de descuento cerca de él. Sin app ni registro: pide por WhatsApp y paga con Yape. |
| **Ciudad** | Menos desperdicio de alimentos. |

## Modelo de negocio
Freemium: **Gratis** (1 oferta al día) y **Pro** (S/ 25 al mes: ofertas ilimitadas, posición destacada y reporte de ventas). Los primeros 2 a 3 meses, todos los negocios usan el plan Pro gratis.

## Alcance del sistema (MVP)
- **Incluye:** vitrina pública de ofertas, pedidos por WhatsApp con código de canje, panel del negocio, reporte mensual, verificación y moderación.
- **No incluye:** pago dentro de la plataforma, logística de envío, app móvil, supermercados ni alertas automáticas.

## Interesados (stakeholders)
Negocios de comida, clientes (estudiantes de la UNSCH y trabajadores del centro), el administrador y fundador, la incubadora UNSCH y entidades reguladoras (Indecopi y municipalidad).

## Cómo se conecta con la arquitectura
```
Necesidad del negocio → Actores → Historias de usuario → Requisitos funcionales
→ Atributos de calidad → Restricciones → Drivers → Decisiones (ADR) → Estilo → Enfoque
```
