# 05 · Restricciones

Condiciones, reglas o limitaciones que deben respetarse durante el desarrollo del sistema.

| ID | Tipo | Restricción | Descripción |
|---|---|---|---|
| RC01 | Tecnológica | **Aplicación web responsive** | El sistema debe funcionar desde el navegador del celular. No se desarrollará una app móvil: el cliente no debe descargar nada. |
| RC02 | Proyecto | **Control de versiones** | El código y la documentación se gestionan con Git y GitHub, con ramas `main` y `developer` y Conventional Commits. |
| RC03 | Tecnológica | **API REST** | La comunicación entre el frontend y el backend se realiza mediante una API REST con JSON. |
| RC04 | Tecnológica | **Node.js + Express** | El backend se desarrolla con Node.js y Express, según el estándar del curso. |
| RC05 | Tecnológica | **Base de datos relacional (PostgreSQL)** | Los datos se almacenan en PostgreSQL, ya que el control de stock y de códigos requiere transacciones. |
| RC06 | Negocio | **Pago fuera de la plataforma** | El sistema no procesa pagos. El cliente paga por Yape directamente al negocio; el sistema solo muestra el número Yape. |
| RC07 | Tecnológica / Costo | **WhatsApp por enlace, sin API** | El pedido se inicia con un enlace `wa.me`. En el MVP no se usa la API de WhatsApp Business (tiene costo y requiere aprobación). |
| RC08 | Legal | **Solo productos aptos y dentro de su fecha** | Está prohibido publicar productos vencidos; la fecha de vencimiento debe ser visible en cada oferta (Indecopi puede multar hasta 450 UIT). |
| RC09 | Legal | **Supermercados fuera del MVP** | La Ley 30498 obliga a los supermercados a donar sus excedentes aptos; por eso el piloto se limita a pollerías, panaderías y pastelerías. |
| RC10 | Proyecto | **Presupuesto y equipo mínimos** | Un solo desarrollador y un presupuesto cercano a cero: hosting en planes gratuitos o de bajo costo. |
| RC11 | Tecnológica | **Contenedores Docker** | A partir del laboratorio 11, el sistema debe poder ejecutarse en contenedores Docker. |
| RC12 | Geográfica | **Alcance inicial: Huamanga** | El MVP opera solo en Huamanga (Ayacucho), pero el modelo de datos debe soportar varias ciudades. |
