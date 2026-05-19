/* ============================================
   Tereré Mix — Promoções Controller
   GET /api/promocoes       → público
   POST/PUT/DELETE          → admin
   ============================================ */

const { db } = require('../models/db');

async function listar(req, res) {
  try {
    const { incluirInativas } = req.query;
    let sql = `SELECT p.*, pr.nome AS produto_nome
               FROM promocoes p
               LEFT JOIN produtos pr ON p.produto_id = pr.id
               WHERE 1=1`;
    if (incluirInativas !== 'true') {
      sql += ` AND p.ativo = true
               AND (p.data_inicio IS NULL OR p.data_inicio <= CURRENT_DATE)
               AND (p.data_fim   IS NULL OR p.data_fim   >= CURRENT_DATE)`;
    }
    sql += ' ORDER BY p.ordem ASC, p.criado_em DESC';
    const promocoes = await db.all(sql, []);
    res.json({ success: true, data: promocoes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function criar(req, res) {
  try {
    const {
      titulo, descricao, preco_original, preco_promocional,
      imagem, ativo = true, ordem = 0,
      data_inicio, data_fim, produto_id,
    } = req.body;

    if (!titulo || preco_promocional == null) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: titulo, preco_promocional.',
      });
    }

    const { lastInsertRowid } = await db.run(
      `INSERT INTO promocoes
         (titulo, descricao, preco_original, preco_promocional,
          imagem, ativo, ordem, data_inicio, data_fim, produto_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        titulo,
        descricao       || null,
        preco_original  != null ? parseFloat(preco_original) : null,
        parseFloat(preco_promocional),
        imagem          || null,
        ativo           ? true : false,
        parseInt(ordem) || 0,
        data_inicio     || null,
        data_fim        || null,
        produto_id      ? parseInt(produto_id) : null,
      ]
    );

    const novo = await db.get('SELECT * FROM promocoes WHERE id = ?', [lastInsertRowid]);
    res.status(201).json({ success: true, data: novo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const existe = await db.get('SELECT id FROM promocoes WHERE id = ?', [req.params.id]);
    if (!existe) {
      return res.status(404).json({ success: false, message: 'Promoção não encontrada.' });
    }

    const {
      titulo, descricao, preco_original, preco_promocional,
      imagem, ativo, ordem, data_inicio, data_fim, produto_id,
    } = req.body;

    await db.exec(
      `UPDATE promocoes SET
         titulo            = COALESCE(?, titulo),
         descricao         = COALESCE(?, descricao),
         preco_original    = COALESCE(?, preco_original),
         preco_promocional = COALESCE(?, preco_promocional),
         imagem            = COALESCE(?, imagem),
         ativo             = COALESCE(?, ativo),
         ordem             = COALESCE(?, ordem),
         data_inicio       = COALESCE(?, data_inicio),
         data_fim          = COALESCE(?, data_fim),
         produto_id        = COALESCE(?, produto_id),
         atualizado_em     = now()
       WHERE id = ?`,
      [
        titulo           ?? null,
        descricao        ?? null,
        preco_original   != null ? parseFloat(preco_original) : null,
        preco_promocional != null ? parseFloat(preco_promocional) : null,
        imagem           ?? null,
        ativo            !== undefined ? Boolean(ativo) : null,
        ordem            != null ? parseInt(ordem) : null,
        data_inicio      ?? null,
        data_fim         ?? null,
        produto_id       != null ? parseInt(produto_id) : null,
        req.params.id,
      ]
    );

    const atualizado = await db.get('SELECT * FROM promocoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function excluir(req, res) {
  try {
    const existe = await db.get('SELECT id FROM promocoes WHERE id = ?', [req.params.id]);
    if (!existe) {
      return res.status(404).json({ success: false, message: 'Promoção não encontrada.' });
    }
    await db.exec('DELETE FROM promocoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Promoção excluída.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listar, criar, atualizar, excluir };
