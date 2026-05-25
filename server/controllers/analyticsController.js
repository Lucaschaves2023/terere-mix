const { db } = require('../models/db');

// GET /api/admin/analytics/dashboard
async function getDashboard(req, res) {
  try {
    const [kpiHoje, kpi30d, topProdutos, vendasDiarias, porTipo, porPagamento, tendenciaMensal] = await Promise.all([
      db.get(`
        SELECT
          COUNT(*)                                                          FILTER (WHERE status != 'cancelado') AS pedidos_hoje,
          COALESCE(SUM(total)  FILTER (WHERE status = 'entregue'), 0)                                          AS receita_hoje,
          COALESCE(AVG(total)  FILTER (WHERE status != 'cancelado'), 0)                                        AS ticket_medio_hoje,
          COUNT(*)             FILTER (WHERE status = 'pendente')                                              AS pendentes_agora,
          COUNT(*)             FILTER (WHERE status = 'preparando')                                            AS preparando_agora
        FROM pedidos
        WHERE criado_em::date = CURRENT_DATE
      `, []),

      db.get(`
        SELECT
          COUNT(*)                                                            FILTER (WHERE status != 'cancelado') AS pedidos_30d,
          COALESCE(SUM(total)  FILTER (WHERE status != 'cancelado'), 0)                                           AS receita_30d,
          COALESCE(AVG(total)  FILTER (WHERE status != 'cancelado'), 0)                                           AS ticket_medio_30d,
          COUNT(*)             FILTER (WHERE status = 'cancelado')                                                AS cancelados_30d
        FROM pedidos
        WHERE criado_em >= CURRENT_DATE - INTERVAL '30 days'
      `, []),

      db.all(`
        SELECT
          ip.nome_produto,
          SUM(ip.quantidade)                 AS total_qtd,
          SUM(ip.quantidade * ip.preco_unit) AS total_valor
        FROM itens_pedido ip
        JOIN pedidos p ON p.id = ip.pedido_id
        WHERE p.criado_em >= CURRENT_DATE - INTERVAL '30 days'
          AND p.status != 'cancelado'
        GROUP BY ip.nome_produto
        ORDER BY total_qtd DESC
        LIMIT 5
      `, []),

      db.all(`
        SELECT
          criado_em::date                                                       AS dia,
          COUNT(*)        FILTER (WHERE status != 'cancelado')                  AS pedidos,
          COALESCE(SUM(total) FILTER (WHERE status != 'cancelado'), 0)          AS receita
        FROM pedidos
        WHERE criado_em >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY criado_em::date
        ORDER BY dia ASC
      `, []),

      db.all(`
        SELECT tipo, COUNT(*) AS total
        FROM pedidos
        WHERE criado_em >= CURRENT_DATE - INTERVAL '30 days'
          AND status != 'cancelado'
        GROUP BY tipo
      `, []),

      db.all(`
        SELECT COALESCE(payment_method, 'Não informado') AS metodo, COUNT(*) AS total
        FROM pedidos
        WHERE criado_em >= CURRENT_DATE - INTERVAL '30 days'
          AND status != 'cancelado'
        GROUP BY payment_method
        ORDER BY total DESC
      `, []),

      db.all(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', criado_em), 'YYYY-MM')                AS mes,
          COUNT(*)       FILTER (WHERE status != 'cancelado')               AS pedidos,
          COALESCE(SUM(total) FILTER (WHERE status != 'cancelado'), 0)      AS receita
        FROM pedidos
        WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', criado_em)
        ORDER BY mes ASC
      `, []),
    ]);

    res.json({
      success: true,
      data: { kpiHoje, kpi30d, topProdutos, vendasDiarias, porTipo, porPagamento, tendenciaMensal },
    });
  } catch (err) {
    console.error('[analytics.getDashboard]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao carregar dashboard.' });
  }
}

// GET /api/admin/analytics/relatorios
async function getRelatorios(req, res) {
  try {
    const {
      data_inicio,
      data_fim,
      status,
      tipo,
      payment_method,
      page  = 1,
      limit = 50,
    } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (data_inicio)    { where += ' AND p.criado_em::date >= ?'; params.push(data_inicio); }
    if (data_fim)       { where += ' AND p.criado_em::date <= ?'; params.push(data_fim); }
    if (status)         { where += ' AND p.status = ?';           params.push(status); }
    if (tipo)           { where += ' AND p.tipo = ?';             params.push(tipo); }
    if (payment_method) { where += ' AND p.payment_method = ?';   params.push(payment_method); }

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const [totais, pedidos] = await Promise.all([
      db.get(`
        SELECT
          COUNT(*)                                           AS total_registros,
          COUNT(*) FILTER (WHERE p.status != 'cancelado')   AS total_pedidos,
          COALESCE(SUM(p.total) FILTER (WHERE p.status != 'cancelado'), 0) AS receita_total,
          COALESCE(AVG(p.total) FILTER (WHERE p.status != 'cancelado'), 0) AS ticket_medio
        FROM pedidos p ${where}
      `, [...params]),

      db.all(`
        SELECT
          p.id, p.numped, p.nome_cliente, p.telefone,
          p.tipo, p.status, p.total,
          p.subtotal_amount, p.delivery_fee, p.discount_amount,
          p.payment_method, p.coupon_code, p.bairro, p.criado_em
        FROM pedidos p
        ${where}
        ORDER BY p.criado_em DESC
        LIMIT ? OFFSET ?
      `, [...params, limitNum, offset]),
    ]);

    res.json({
      success: true,
      data: {
        totais,
        pedidos,
        paginacao: {
          page:  pageNum,
          limit: limitNum,
          total: parseInt(totais.total_registros || 0),
          pages: Math.ceil(parseInt(totais.total_registros || 0) / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('[analytics.getRelatorios]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao carregar relatórios.' });
  }
}

module.exports = { getDashboard, getRelatorios };
