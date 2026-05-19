/* ============================================
   Tereré Mix — Pedido Controller (PostgreSQL)
   Transação: insere pedido + itens + baixa estoque
   ============================================ */

const { db } = require('../models/db');

// GET /api/pedidos
async function listar(req, res) {
  try {
    const { status, tipo, limit = 50 } = req.query;
    let sql = 'SELECT * FROM pedidos WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (tipo)   { sql += ' AND tipo = ?';   params.push(tipo); }
    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(parseInt(limit));
    const pedidos = await db.all(sql, params);
    res.json({ success: true, data: pedidos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/pedidos/:id
async function buscarPorId(req, res) {
  try {
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
    const itens = await db.all('SELECT * FROM itens_pedido WHERE pedido_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...pedido, itens } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/pedidos
async function criar(req, res) {
  try {
    const {
      tipo = 'online',
      nome_cliente,
      telefone,
      endereco,
      observacao,
      itens,
      coupon_code         = null,
      discount_type       = null,
      discount_percentage = null,
      discount_amount     = 0,
      delivery_fee        = 0,
      credit_surcharge    = 0,
      payment_method      = null,
    } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ success: false, message: 'O pedido deve ter ao menos 1 item.' });
    }

    const pedidoId = await db.transaction(async (tx) => {
      let subtotalItens = 0;
      const resolvidos  = [];

      // Valida produtos e estoque dentro da transação
      for (const item of itens) {
        const produto = await tx.get(
          'SELECT * FROM produtos WHERE id = ? AND ativo = true', [item.produto_id]
        );
        if (!produto) throw new Error(`Produto ID ${item.produto_id} não encontrado.`);
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}.`);
        }
        subtotalItens += parseFloat(produto.preco) * item.quantidade;
        resolvidos.push({ produto, quantidade: item.quantidade });
      }

      // Calcula total final
      const descontoVal   = parseFloat(discount_amount)  || 0;
      const taxaEntrega   = parseFloat(delivery_fee)      || 0;
      const acrescimoCred = parseFloat(credit_surcharge)  || 0;
      const totalFinal    = subtotalItens - descontoVal + taxaEntrega + acrescimoCred;

      // Insere pedido
      const { lastInsertRowid: pedidoId } = await tx.run(
        `INSERT INTO pedidos
           (tipo, nome_cliente, telefone, endereco, total, observacao,
            coupon_code, discount_type, discount_percentage, discount_amount,
            subtotal_amount, delivery_fee, credit_surcharge, payment_method)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          tipo,
          nome_cliente || null,
          telefone     || null,
          endereco     || null,
          totalFinal,
          observacao   || null,
          coupon_code  || null,
          discount_type || null,
          discount_percentage != null ? parseFloat(discount_percentage) : null,
          descontoVal   > 0 ? descontoVal   : null,
          subtotalItens,
          taxaEntrega   > 0 ? taxaEntrega   : null,
          acrescimoCred > 0 ? acrescimoCred : null,
          payment_method || null,
        ]
      );

      // Itens + baixa de estoque + movimentação
      for (const { produto, quantidade } of resolvidos) {
        await tx.exec(
          'INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, preco_unit, quantidade) VALUES (?,?,?,?,?)',
          [pedidoId, produto.id, produto.nome, produto.preco, quantidade]
        );
        await tx.exec(
          'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
          [quantidade, produto.id]
        );
        await tx.exec(
          "INSERT INTO estoque_movimentacao (produto_id, tipo, quantidade, motivo) VALUES (?,'saida',?,?)",
          [produto.id, quantidade, `Pedido #${pedidoId}`]
        );
      }

      // Incrementa uso do cupom (ignora silenciosamente se falhar)
      if (coupon_code) {
        try {
          await tx.exec(
            'UPDATE coupons SET usage_count = usage_count + 1, updated_at = now() WHERE upper(code) = upper(?)',
            [coupon_code]
          );
        } catch { /* ignora */ }
      }

      return pedidoId;
    });

    const pedido      = await db.get('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
    const itensSalvos = await db.all('SELECT * FROM itens_pedido WHERE pedido_id = ?', [pedidoId]);

    res.status(201).json({ success: true, data: { ...pedido, itens: itensSalvos } });
  } catch (err) {
    const status = err.message.includes('insuficiente') ? 409 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

// PATCH /api/pedidos/:id/status
async function atualizarStatus(req, res) {
  try {
    const VALIDOS = ['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'];
    const { status } = req.body;
    if (!VALIDOS.includes(status)) {
      return res.status(400).json({ success: false, message: `Status inválido. Use: ${VALIDOS.join(', ')}.` });
    }
    const pedido = await db.get('SELECT id, status FROM pedidos WHERE id = ?', [req.params.id]);
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });

    if (status === 'cancelado') {
      // Cancela e devolve estoque dentro de uma transação
      await db.transaction(async (tx) => {
        const itens = await tx.all('SELECT * FROM itens_pedido WHERE pedido_id = ?', [req.params.id]);
        for (const item of itens) {
          await tx.exec(
            'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
          await tx.exec(
            "INSERT INTO estoque_movimentacao (produto_id, tipo, quantidade, motivo) VALUES (?,'entrada',?,?)",
            [item.produto_id, item.quantidade, `Cancelamento pedido #${req.params.id}`]
          );
        }
        await tx.exec(
          'UPDATE pedidos SET status = ?, atualizado_em = now() WHERE id = ?',
          [status, req.params.id]
        );
      });
    } else {
      await db.exec(
        'UPDATE pedidos SET status = ?, atualizado_em = now() WHERE id = ?',
        [status, req.params.id]
      );
    }

    const atualizado = await db.get('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, atualizarStatus };
