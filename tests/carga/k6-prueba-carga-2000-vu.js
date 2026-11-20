import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================================
// PRUEBA DE CARGA k6: SIMULACIÓN PROGRESIVA HASTA 2,000 USUARIOS VIRTUALES (VU)
// Curso: Arquitectura de Software [IS-488] · UNSCH (Semestre 2026-II)
// Docente: Ing. Lizbeth Jaico Quispe · Estudiante: Jack Franklin Quispe Luján
// Escenario evaluado: EQ-01 (Rendimiento) y EQ-02 (Concurrencia sobre ofertas)
// ============================================================================

export const options = {
  stages: [
    { duration: '30s', target: 200 },   // Calentamiento: rampa a 200 VUs
    { duration: '1m',  target: 500 },   // Tráfico habitual de cierre: 500 VUs
    { duration: '1m',  target: 1000 },  // Hora pico en Huamanga (18:30 hrs): 1,000 VUs
    { duration: '1m30s', target: 2000 },// Estrés máximo solicitado por la docente: 2,000 VUs
    { duration: '1m',  target: 2000 },  // Meseta de estabilidad a 2,000 VUs
    { duration: '30s', target: 0 },     // Rampa de descenso y recuperación
  ],
  thresholds: {
    // EQ-01: El 95% de las peticiones debe responder en menos de 500 ms
    http_req_duration: ['p(95)<500'],
    // Menos del 1% de errores HTTP (5xx)
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'https://jama-web.vercel.app/api/v1';

export default function () {
  // 1. Consulta del catálogo público de ofertas (Vitrina móvil) - 70% del tráfico
  const resVitrina = http.get(`${BASE_URL}/ofertas/vigentes`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GetOfertasVigentes' },
  });

  check(resVitrina, {
    'Vitrina status 200': (r) => r.status === 200,
    'Vitrina responde en < 500ms': (r) => r.timings.duration < 500,
    'Vitrina tiene ofertas en JSON': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // 2. Consulta de perfil público de tienda (/t/panaderia-ejemplo) - 20% del tráfico
  const resTienda = http.get(`${BASE_URL}/negocios/publico/panaderia-ejemplo`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GetPerfilTienda' },
  });

  check(resTienda, {
    'Tienda status 200': (r) => r.status === 200,
    'Tienda responde en < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(1);

  // 3. Intento de reserva de pedido (Petición transaccional con bloqueo pesimista) - 10% del tráfico
  const payloadReserva = JSON.stringify({
    ofertaId: 'f8a4534d-27b6-47e8-a7f0-deb36fbcc325', // ID de oferta de prueba
  });

  const resReserva = http.post(`${BASE_URL}/pedidos`, payloadReserva, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    tags: { name: 'PostPedirOferta' },
  });

  // La respuesta debe ser 201 (reserva exitosa) o 409 (oferta agotada), nunca 500
  check(resReserva, {
    'Reserva responde 201 o 409 (sin 500)': (r) => r.status === 201 || r.status === 409,
    'Reserva responde en < 600ms': (r) => r.timings.duration < 600,
  });

  sleep(2);
}
