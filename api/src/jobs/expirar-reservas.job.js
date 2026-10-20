import cron from 'node-cron';

/** ADR-005: ejecuta ExpirarReservas cada minuto dentro del mismo backend. */
export function programarExpiracionDeReservas(expirarReservas) {
  return cron.schedule('* * * * *', async () => {
    try {
      const { expirados } = await expirarReservas.ejecutar();
      if (expirados > 0) {
        console.log(`[expirar-reservas] ${expirados} reserva(s) expirada(s)`);
      }
    } catch (error) {
      console.error('[expirar-reservas] error al expirar reservas', error);
    }
  });
}
