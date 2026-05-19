/* ============================================
   Tereré Mix — Cupom Controller (PostgreSQL)
   CRUD completo + validação para o checkout
   ============================================ */

const { db } = require('../models/db');

function fmtLabel(coupon) {
  if (coupon.type === 'percent') return `${coupon.percentage}% de desconto`;
  return `R$ ${Number(coupon.fixed_amount).toFixed(2).replace('.', ',')} de desconto`;
}

// GET /api/cupons
async function listar(req, res) {
  try {
    const { search, active } = req.query;
    let sql = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];
    if (active !== undefined && active !== '') {
      sql += ' AND active = ?';
      params.push(active === 'true' || active === '1');
    }
    if (search && search.trim()) {
      sql += ' AND (upper(code) LIKE upper(?) OR name ILIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const coupons = await db.all(sql, params);
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error('[cupons.listar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// GET /api/cupons/:id
async function buscarPorId(req, res) {
  try {
    const coupon = await db.get('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom não encontrado.' });
    res.json({ success: true, data: coupon });
  } catch (err) {
    console.error('[cupons.buscarPorId]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// POST /api/cupons/validar  (usado pelo checkout — rota pública)
async function validar(req, res) {
  try {
    const { code, subtotal } = req.body;
    if (!code || !code.trim()) {
      return res.json({ success: true, data: { valido: false, erro: 'Informe o código do cupom.' } });
    }

    const coupon = await db.get('SELECT * FROM coupons WHERE upper(code) = upper(?)', [code.trim()]);
    if (!coupon) {
      return res.json({ success: true, data: { valido: false, erro: 'Cupom inválido.' } });
    }
    if (!coupon.active) {
      return res.json({ success: true, data: { valido: false, erro: 'Cupom inativo.' } });
    }
    if (coupon.expires_at) {
      const exp = new Date(coupon.expires_at);
      exp.setHours(23, 59, 59, 999);
      if (new Date() > exp) {
        return res.json({ success: true, data: { valido: false, erro: 'Cupom expirado.' } });
      }
    }
    if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
      return res.json({ success: true, data: { valido: false, erro: 'Cupom atingiu o limite de uso.' } });
    }
    if (coupon.minimum_order_value != null && subtotal != null) {
      const sub = parseFloat(subtotal);
      if (sub < coupon.minimum_order_value) {
        const min = `R$ ${Number(coupon.minimum_order_value).toFixed(2).replace('.', ',')}`;
        return res.json({ success: true, data: { valido: false, erro: `Pedido mínimo de ${min}.` } });
      }
    }

    const cupomObj = {
      codigo: coupon.code.toUpperCase(),
      type:   coupon.type,
      value:  coupon.type === 'percent' ? coupon.percentage : coupon.fixed_amount,
      label:  fmtLabel(coupon),
    };

    res.json({ success: true, data: { valido: true, cupom: cupomObj } });
  } catch (err) {
    console.error('[cupons.validar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// POST /api/cupons
async function criar(req, res) {
  try {
    const {
      name, code, type,
      percentage, fixed_amount,
      active = true,
      expires_at, usage_limit,
      minimum_order_value, description,
    } = req.body;

    if (!name || !name.trim())  return res.status(400).json({ success: false, message: 'Nome é obrigatório.' });
    if (!code || !code.trim())  return res.status(400).json({ success: false, message: 'Código é obrigatório.' });
    if (!type)                  return res.status(400).json({ success: false, message: 'Tipo é obrigatório.' });

    if (type === 'percent') {
      if (percentage == null || parseFloat(percentage) < 0 || parseFloat(percentage) > 100) {
        return res.status(400).json({ success: false, message: 'Percentual deve ser entre 0 e 100.' });
      }
    }
    if (type === 'fixed') {
      if (fixed_amount == null || parseFloat(fixed_amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Valor fixo deve ser maior que zero.' });
      }
    }

    const existing = await db.get('SELECT id FROM coupons WHERE upper(code) = upper(?)', [code.trim()]);
    if (existing) return res.status(400).json({ success: false, message: 'Já existe um cupom com esse código.' });

    const { lastInsertRowid } = await db.run(
      `INSERT INTO coupons
         (name, code, type, percentage, fixed_amount, active, expires_at, usage_limit, minimum_order_value, description)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        type,
        percentage   != null ? parseFloat(percentage)   : null,
        fixed_amount != null ? parseFloat(fixed_amount)  : null,
        Boolean(active),
        expires_at || null,
        usage_limit ? parseInt(usage_limit) : null,
        minimum_order_value ? parseFloat(minimum_order_value) : null,
        description || null,
      ]
    );

    const coupon = await db.get('SELECT * FROM coupons WHERE id = ?', [lastInsertRowid]);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    console.error('[cupons.criar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// PUT /api/cupons/:id
async function atualizar(req, res) {
  try {
    const coupon = await db.get('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom não encontrado.' });

    const body = req.body;

    // Verifica duplicidade de código
    if (body.code !== undefined && body.code.trim().toUpperCase() !== coupon.code) {
      const dup = await db.get(
        'SELECT id FROM coupons WHERE upper(code) = upper(?) AND id != ?',
        [body.code.trim(), req.params.id]
      );
      if (dup) return res.status(400).json({ success: false, message: 'Já existe um cupom com esse código.' });
    }

    const updates = {};
    if (body.name               !== undefined) updates.name               = body.name.trim();
    if (body.code               !== undefined) updates.code               = body.code.trim().toUpperCase();
    if (body.type               !== undefined) updates.type               = body.type;
    if (body.percentage         !== undefined) updates.percentage         = body.percentage  != null ? parseFloat(body.percentage)  : null;
    if (body.fixed_amount       !== undefined) updates.fixed_amount       = body.fixed_amount != null ? parseFloat(body.fixed_amount) : null;
    if (body.active             !== undefined) updates.active             = Boolean(body.active);
    if (body.expires_at         !== undefined) updates.expires_at         = body.expires_at || null;
    if (body.usage_limit        !== undefined) updates.usage_limit        = body.usage_limit ? parseInt(body.usage_limit) : null;
    if (body.minimum_order_value !== undefined) updates.minimum_order_value = body.minimum_order_value ? parseFloat(body.minimum_order_value) : null;
    if (body.description        !== undefined) updates.description        = body.description || null;

    const keys = Object.keys(updates);
    if (keys.length > 0) {
      const setClause = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = now()';
      await db.exec(
        `UPDATE coupons SET ${setClause} WHERE id = ?`,
        [...keys.map(k => updates[k]), req.params.id]
      );
    }

    const updated = await db.get('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[cupons.atualizar]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// DELETE /api/cupons/:id
async function excluir(req, res) {
  try {
    const coupon = await db.get('SELECT id, code FROM coupons WHERE id = ?', [req.params.id]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupom não encontrado.' });
    await db.exec('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Cupom excluído.` });
  } catch (err) {
    console.error('[cupons.excluir]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { listar, buscarPorId, validar, criar, atualizar, excluir };
