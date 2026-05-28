/* ============================================
   Tereré Mix — Empresa Controller (PostgreSQL)
   Gerencia as configurações da loja (registro único)
   ============================================ */

const { db } = require('../models/db');

async function getEmpresa(req, res) {
  try {
    const empresa = await db.get('SELECT * FROM empresa WHERE id = 1');
    res.json({ success: true, data: empresa || null });
  } catch (err) {
    console.error('[empresa.get]', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

async function updateEmpresa(req, res) {
  try {
    const {
      nome_empresa, nome_fantasia, whatsapp, instagram,
      endereco, cidade, uf, horario_funcionamento,
      taxa_entrega_padrao, logo_url, mensagem_whatsapp,
    } = req.body;

    // Sanitiza WhatsApp: só dígitos
    const wpp = whatsapp != null ? String(whatsapp).replace(/\D/g, '') : null;
    if (wpp && (wpp.length < 10 || wpp.length > 13)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp inválido. Use apenas números com DDD (10 a 13 dígitos).',
      });
    }

    // Sanitiza taxa: evita NaN que quebra o PostgreSQL
    const taxaRaw = parseFloat(taxa_entrega_padrao);
    const taxaVal = !isNaN(taxaRaw) && taxa_entrega_padrao !== '' && taxa_entrega_padrao != null
      ? taxaRaw
      : null;

    const ufVal = uf ? String(uf).toUpperCase().slice(0, 2) : null;

    // UPSERT atômico — insere ou atualiza o único registro (id = 1)
    const rows = await db.all(
      `INSERT INTO empresa
         (id, nome_empresa, nome_fantasia, whatsapp, instagram,
          endereco, cidade, uf, horario_funcionamento,
          taxa_entrega_padrao, logo_url, mensagem_whatsapp, atualizado_em)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
       ON CONFLICT (id) DO UPDATE SET
         nome_empresa          = EXCLUDED.nome_empresa,
         nome_fantasia         = EXCLUDED.nome_fantasia,
         whatsapp              = EXCLUDED.whatsapp,
         instagram             = EXCLUDED.instagram,
         endereco              = EXCLUDED.endereco,
         cidade                = EXCLUDED.cidade,
         uf                    = EXCLUDED.uf,
         horario_funcionamento = EXCLUDED.horario_funcionamento,
         taxa_entrega_padrao   = EXCLUDED.taxa_entrega_padrao,
         logo_url              = EXCLUDED.logo_url,
         mensagem_whatsapp     = EXCLUDED.mensagem_whatsapp,
         atualizado_em         = now()
       RETURNING *`,
      [
        nome_empresa          || null,
        nome_fantasia         || null,
        wpp                   || null,
        instagram             || null,
        endereco              || null,
        cidade                || null,
        ufVal,
        horario_funcionamento || null,
        taxaVal,
        logo_url              || null,
        mensagem_whatsapp     || null,
      ]
    );

    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('[empresa.update] ERRO:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { getEmpresa, updateEmpresa };
