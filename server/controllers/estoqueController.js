/* ============================================
   Tereré Mix — Estoque Controller (PostgreSQL)
   ============================================ */

const { db } = require('../models/db');

// GET /api/estoque
async function listar(req, res) {
  try {
    const produtos = await db.all(
      'SELECT id, nome, categoria, preco, estoque, ativo FROM produtos ORDER BY categoria, nome'
    );
    res.json({ success: true, data: produtos });
  } catch (err) {
    console.error('[estoque.listar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// POST /api/estoque/entrada
async function registrarEntrada(req, res) {
  try {
    const { produto_id, quantidade, motivo } = req.body;
    if (!produto_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({ success: false, message: 'produto_id e quantidade (> 0) são obrigatórios.' });
    }
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [produto_id]);
    if (!produto) return res.status(404).json({ success: false, message: 'Produto não encontrado.' });

    await db.transaction(async (tx) => {
      await tx.exec(
        'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
        [quantidade, produto_id]
      );
      await tx.exec(
        "INSERT INTO estoque_movimentacao (produto_id, tipo, quantidade, motivo) VALUES (?,'entrada',?,?)",
        [produto_id, quantidade, motivo || 'Entrada manual']
      );
    });

    const atualizado = await db.get('SELECT id, nome, estoque FROM produtos WHERE id = ?', [produto_id]);
    res.json({ success: true, data: atualizado });
  } catch (err) {
    console.error('[estoque.registrarEntrada]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// GET /api/estoque/movimentacoes
async function listarMovimentacoes(req, res) {
  try {
    const { produto_id, limit = 50 } = req.query;
    let sql = `
      SELECT m.*, p.nome as produto_nome
      FROM estoque_movimentacao m
      JOIN produtos p ON p.id = m.produto_id
      WHERE 1=1
    `;
    const params = [];
    if (produto_id) { sql += ' AND m.produto_id = ?'; params.push(produto_id); }
    sql += ' ORDER BY m.criado_em DESC LIMIT ?';
    params.push(parseInt(limit));
    const movs = await db.all(sql, params);
    res.json({ success: true, data: movs });
  } catch (err) {
    console.error('[estoque.listarMovimentacoes]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { listar, registrarEntrada, listarMovimentacoes };
