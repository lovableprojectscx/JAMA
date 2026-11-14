import { CodigoCanjeRepository } from '../dominio/puertos.js';
import { CodigoCanje } from '../dominio/codigo-canje.js';

function filaACodigoCanje(fila) {
  if (!fila) return null;
  return new CodigoCanje({
    id: fila.id,
    codigo: fila.codigo,
    ofertaId: fila.oferta_id,
    negocioId: fila.negocio_id,
    estado: fila.estado,
    creadoEn: fila.creado_en,
    expiraEn: fila.expira_en,
    historial: fila.historial,
    precio: fila.precio == null ? null : Number(fila.precio),
  });
}

export class CodigoCanjeRepositoryPg extends CodigoCanjeRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async guardar(codigoCanje, tx) {
    const ejecutor = tx ?? this.pool;
    await ejecutor.query(
      `INSERT INTO codigos_canje (id, codigo, oferta_id, negocio_id, estado, creado_en, expira_en, historial, precio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
         SET estado = EXCLUDED.estado,
             historial = EXCLUDED.historial`,
      [
        codigoCanje.id,
        codigoCanje.codigo,
        codigoCanje.ofertaId,
        codigoCanje.negocioId,
        codigoCanje.estado,
        codigoCanje.creadoEn,
        codigoCanje.expiraEn,
        JSON.stringify(codigoCanje.historial),
        codigoCanje.precio,
      ]
    );
  }

  async buscarPorCodigo(codigo, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT * FROM codigos_canje WHERE codigo = $1 AND estado = 'RESERVADO'
       ORDER BY creado_en DESC LIMIT 1 FOR UPDATE`,
      [codigo]
    );
    return filaACodigoCanje(rows[0]);
  }

  async existeCodigoActivo(codigo, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT 1 FROM codigos_canje WHERE codigo = $1 AND estado = 'RESERVADO'`,
      [codigo]
    );
    return rows.length > 0;
  }

  async listarReservadosVencidos(ahora, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT * FROM codigos_canje
        WHERE estado = 'RESERVADO' AND expira_en <= $1
        FOR UPDATE SKIP LOCKED`,
      [ahora]
    );
    return rows.map(filaACodigoCanje);
  }

  /** RN-10: el panel del negocio solo ve los códigos de su propio negocio. */
  async listarPorNegocioYEstado(negocioId, estado) {
    const { rows } = await this.pool.query(
      `SELECT * FROM codigos_canje WHERE negocio_id = $1 AND estado = $2 ORDER BY expira_en ASC`,
      [negocioId, estado]
    );
    return rows.map(filaACodigoCanje);
  }

  /**
   * RF18 / RF19: métricas agregadas de negocio en el período dado.
   * Agrupa ventas concretadas, reservas, dinero recuperado e impacto ambiental.
   */
  async obtenerMetricas(negocioId, { desde = null, hasta = null } = {}) {
    const consultaKpis = `
      SELECT
        COUNT(*) FILTER (WHERE c.estado = 'VENDIDO') AS total_vendidos,
        COALESCE(SUM(c.precio) FILTER (WHERE c.estado = 'VENDIDO'), 0) AS total_dinero_recuperado,
        COALESCE(SUM(o.precio_carta) FILTER (WHERE c.estado = 'VENDIDO'), 0) AS total_valor_original,
        COUNT(*) FILTER (WHERE c.estado = 'RESERVADO') AS total_reservados,
        COUNT(*) FILTER (WHERE c.estado = 'NO_CONCRETADO') AS total_no_concretados,
        COUNT(*) FILTER (WHERE c.estado = 'EXPIRADO') AS total_expirados,
        COUNT(*) AS total_pedidos
      FROM codigos_canje c
      LEFT JOIN ofertas o ON c.oferta_id = o.id
      WHERE c.negocio_id = $1
        AND ($2::timestamptz IS NULL OR c.creado_en >= $2)
        AND ($3::timestamptz IS NULL OR c.creado_en <= $3);
    `;

    const consultaTop = `
      SELECT
        o.id,
        o.titulo,
        o.foto_url,
        COUNT(c.id) AS raciones_vendidas,
        COALESCE(SUM(c.precio), 0) AS dinero_recuperado
      FROM codigos_canje c
      JOIN ofertas o ON c.oferta_id = o.id
      WHERE c.negocio_id = $1
        AND c.estado = 'VENDIDO'
        AND ($2::timestamptz IS NULL OR c.creado_en >= $2)
        AND ($3::timestamptz IS NULL OR c.creado_en <= $3)
      GROUP BY o.id, o.titulo, o.foto_url
      ORDER BY raciones_vendidas DESC, dinero_recuperado DESC
      LIMIT 5;
    `;

    const [resKpis, resTop] = await Promise.all([
      this.pool.query(consultaKpis, [negocioId, desde, hasta]),
      this.pool.query(consultaTop, [negocioId, desde, hasta]),
    ]);

    const kpi = resKpis.rows[0] || {};
    return {
      totalVendidos: Number(kpi.total_vendidos || 0),
      totalDineroRecuperado: Number(kpi.total_dinero_recuperado || 0),
      totalValorOriginal: Number(kpi.total_valor_original || 0),
      totalReservados: Number(kpi.total_reservados || 0),
      totalNoConcretados: Number(kpi.total_no_concretados || 0),
      totalExpirados: Number(kpi.total_expirados || 0),
      totalPedidos: Number(kpi.total_pedidos || 0),
      topOfertas: resTop.rows.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        fotoUrl: r.foto_url,
        racionesVendidas: Number(r.raciones_vendidas || 0),
        dineroRecuperado: Number(r.dinero_recuperado || 0),
      })),
    };
  }

  /**
   * RF15 / RF18 / HU09: Listado de pedidos/canjes para el panel de administración central JAMA.
   */
  async listarParaAdmin({ estado = null, limite = 50 } = {}) {
    const query = `
      SELECT
        c.id,
        c.codigo,
        c.estado,
        c.precio,
        c.creado_en,
        c.expira_en,
        c.historial,
        n.id AS negocio_id,
        n.nombre AS negocio_nombre,
        n.whatsapp AS negocio_whatsapp,
        n.direccion AS negocio_direccion,
        o.id AS oferta_id,
        o.titulo AS oferta_titulo,
        o.precio_carta AS oferta_precio_carta
      FROM codigos_canje c
      JOIN negocios n ON c.negocio_id = n.id
      JOIN ofertas o ON c.oferta_id = o.id
      WHERE ($1::text IS NULL OR c.estado = $1)
      ORDER BY c.creado_en DESC
      LIMIT $2;
    `;
    const { rows } = await this.pool.query(query, [estado, limite]);
    return rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      estado: r.estado,
      precio: r.precio != null ? Number(r.precio) : null,
      creadoEn: r.creado_en,
      expiraEn: r.expira_en,
      historial: r.historial,
      negocio: {
        id: r.negocio_id,
        nombre: r.negocio_nombre,
        whatsapp: r.negocio_whatsapp,
        direccion: r.negocio_direccion,
      },
      oferta: {
        id: r.oferta_id,
        titulo: r.oferta_titulo,
        precioCarta: r.oferta_precio_carta != null ? Number(r.oferta_precio_carta) : null,
      },
    }));
  }
}
