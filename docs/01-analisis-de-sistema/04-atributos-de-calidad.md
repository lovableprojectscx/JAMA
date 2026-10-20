# 04 · Atributos de calidad

Los atributos de calidad describen **cómo** debe comportarse el sistema, más allá de lo que hace.

## Escenario base
Entre las **17:00 y las 21:00** (hora de cierre de pollerías, panaderías y pastelerías) se concentra casi toda la actividad: los negocios publican a la vez, cientos de clientes consultan desde el celular con datos móviles y varios intentan pedir la **misma oferta de pocas unidades** al mismo tiempo. Las ofertas pierden su valor en pocas horas.

## Atributos

| ID | Atributo | Escenario de calidad | Medida esperada |
|---|---|---|---|
| AC01 | **Rendimiento** | Un cliente abre el listado de ofertas desde un celular con 4G en la hora de cierre. | El listado carga en menos de 2 s y la página inicial pesa menos de 1 MB (imágenes comprimidas). |
| AC02 | **Consistencia de datos (integridad)** | Dos o más clientes piden la última unidad de una oferta al mismo tiempo. | Nunca se generan más códigos reservados que unidades disponibles (0 sobreventas). |
| AC03 | **Disponibilidad** | Los negocios publican y los clientes piden durante la franja de cierre. | Disponible el 99 % del tiempo en la franja de 17:00 a 21:00. |
| AC04 | **Seguridad** | Un negocio intenta ver o modificar las ofertas o los códigos de otro negocio. | El acceso es denegado; cada negocio solo accede a sus propios datos. Contraseñas cifradas y comunicación por HTTPS. |
| AC05 | **Usabilidad** | Un cliente que entra por primera vez desde un link de WhatsApp quiere pedir una oferta. | Llega al chat de WhatsApp con el código en 3 toques o menos, sin registro. El negocio publica una oferta en menos de 1 minuto. |
| AC06 | **Confiabilidad de la información (confianza)** | Un cliente consulta una oferta. | Toda oferta muestra la fecha de vencimiento y el precio de carta verificado; las ofertas vencidas desaparecen del listado en menos de 1 minuto. |
| AC07 | **Trazabilidad** | A fin de mes, el negocio consulta su reporte. | El 100 % de los códigos generados queda registrado con su estado (reservado, vendido, no concretado, expirado) y la fecha de cada cambio. |
| AC08 | **Escalabilidad** | La plataforma se replica en Cusco y otras ciudades. | Se agrega una ciudad por configuración (datos), sin cambiar código. |
| AC09 | **Mantenibilidad** | Se agrega una funcionalidad nueva (p. ej. alertas o pago por pedido). | El cambio se hace en un módulo sin modificar los demás. |
