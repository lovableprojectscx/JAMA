import { crearAplicacion } from './crear-aplicacion.js';
import { programarExpiracionDeReservas } from './jobs/expirar-reservas.job.js';

const { app, expirarReservas } = crearAplicacion();

programarExpiracionDeReservas(expirarReservas);

const puerto = process.env.PORT ?? 3000;
app.listen(puerto, () => {
  console.log(`JAMA API escuchando en el puerto ${puerto}`);
});
