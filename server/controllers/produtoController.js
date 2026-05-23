/* ============================================
   Tereré Mix — Produto Controller (PostgreSQL)
   ============================================ */

const { db } = require('../models/db');

// GET /api/produtos
async function listar(req, res) {
  try {
    const { categoria, incluirInativos } = req.query;
    let sql = incluirInativos === 'true'
      ? 'SELECT * FROM produtos WHERE 1=1'
      : 'SELECT * FROM produtos WHERE ativo = true';
    const params = [];
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    sql += ' ORDER BY categoria, nome';
    const produtos = await db.all(sql, params);
    res.json({ success: true, data: produtos });
  } catch (err) {
    console.error('[produtos.listar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// GET /api/produtos/:id
async function buscarPorId(req, res) {
  try {
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!produto) return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    res.json({ success: true, data: produto });
  } catch (err) {
    console.error('[produtos.buscarPorId]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// POST /api/produtos
async function criar(req, res) {
  try {
    const { nome, descricao, preco, categoria, imagem, estoque, marca, sabor } = req.body;
    if (!nome || preco == null) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: nome, preco.' });
    }
    const { lastInsertRowid } = await db.run(
      'INSERT INTO produtos (nome, descricao, preco, categoria, imagem, estoque, marca, sabor) VALUES (?,?,?,?,?,?,?,?)',
      [nome, descricao || null, preco, categoria || 'Geral', imagem || null, estoque || 0, marca || null, sabor || null]
    );
    const novo = await db.get('SELECT * FROM produtos WHERE id = ?', [lastInsertRowid]);
    res.status(201).json({ success: true, data: novo });
  } catch (err) {
    console.error('[produtos.criar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// PUT /api/produtos/:id
async function atualizar(req, res) {
  try {
    const { nome, descricao, preco, categoria, imagem, estoque, ativo, marca, sabor } = req.body;
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!produto) return res.status(404).json({ success: false, message: 'Produto não encontrado.' });

    const ativoVal = ativo !== undefined ? Boolean(ativo) : null;

    await db.exec(
      `UPDATE produtos SET
        nome      = COALESCE(?, nome),
        descricao = COALESCE(?, descricao),
        preco     = COALESCE(?, preco),
        categoria = COALESCE(?, categoria),
        imagem    = COALESCE(?, imagem),
        estoque   = COALESCE(?, estoque),
        ativo     = COALESCE(?, ativo),
        marca     = COALESCE(?, marca),
        sabor     = COALESCE(?, sabor)
       WHERE id = ?`,
      [
        nome      ?? null,
        descricao ?? null,
        preco     ?? null,
        categoria ?? null,
        imagem    ?? null,
        estoque   ?? null,
        ativoVal,
        marca     ?? null,
        sabor     ?? null,
        req.params.id,
      ]
    );
    const atualizado = await db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (err) {
    console.error('[produtos.atualizar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// DELETE /api/produtos/:id  (soft delete)
async function desativar(req, res) {
  try {
    const produto = await db.get('SELECT id FROM produtos WHERE id = ?', [req.params.id]);
    if (!produto) return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    await db.exec('UPDATE produtos SET ativo = false WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Produto desativado com sucesso.' });
  } catch (err) {
    console.error('[produtos.desativar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, desativar };
