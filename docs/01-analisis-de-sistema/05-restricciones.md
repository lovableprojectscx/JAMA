# 05 · Restricciones

Condiciones, reglas o limitaciones que deben respetarse durante el desarrollo del sistema.

| ID | Tipo | Restricción | Descripción |
|---|---|---|---|
| RC01 | Tecnológica | **Aplicación web responsive** | El sistema debe funcionar desde el navegador del celular. No se desarrollará una app móvil nativa: el cliente no debe descargar nada. |
| RC02 | Proyecto | **Control de versiones** | El código y la documentación se gestionan con Git y GitHub, con ramas `main` y Conventional Commits. |
| RC03 | Tecnológica | **API REST** | La comunicación entre el frontend y el backend se realiza mediante una API REST con JSON y códigos de estado HTTP estándar. |
| RC04 | Tecnológica | **Node.js + Express** | El backend se desarrolla con Node.js y Express en Clean Architecture y Monolito Modular. |
| RC05 | Tecnológica | **Base de datos relacional (PostgreSQL)** | Los datos se almacenan en PostgreSQL con transacciones ACID para evitar sobreventa y colisiones concurrentes de stock. |
| RC06 | Negocio / Operativo | **Modelo Concierge de Cobro Centralizado con Yape** | El sistema no integra pasarela bancaria automatizada con comisiones (Niubiz/Culqi). El cliente paga centralizadamente al Yape oficial de JAMA, y el operador JAMA liquida al negocio aliado al confirmar el comprobante. |
| RC07 | Tecnológica / Costo | **WhatsApp por enlace, sin API de pago** | El pedido y las confirmaciones se apoyan en enlaces estructurados `wa.me`. En el MVP no se usa la API de WhatsApp Business Cloud (tiene costo recurrente y requiere aprobación de plantillas de Meta). |
| RC08 | Legal | **Solo productos aptos y dentro de su fecha** | Está estrictamente prohibido publicar productos vencidos o descompuestos; compromiso explícito bajo declaración jurada en el registro de negocios (cumplimiento normativo DIGESA/Indecopi). |
| RC09 | Legal | **Supermercados fuera del MVP** | La Ley 30498 obliga a los supermercados a donar sus excedentes; por eso el piloto se limita a pollerías, panaderías, pastelerías y restaurantes independientes. |
| RC10 | Proyecto | **Presupuesto y equipo mínimos** | Un solo desarrollador y un presupuesto controlado: despliegue en Vercel y base de datos gestionada en Supabase PostgreSQL. |
| RC11 | Tecnológica | **Despliegue serverless y contenedores** | El sistema cuenta con entrada tradicional y serverless (`entrada-vercel.js`), preparada para escalabilidad horizontal. |
| RC12 | Geográfica | **Alcance inicial: Huamanga** | El MVP opera focalizado en Huamanga (Ayacucho), en Zona Centro, pero el modelo de datos soporta varias ciudades. |
