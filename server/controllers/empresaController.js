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
    console.error('[empresa.get]', err.message);
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

    // Sanitiza e valida WhatsApp
    const wpp = whatsapp != null ? String(whatsapp).replace(/\D/g, '') : null;
    if (wpp && (wpp.length < 10 || wpp.length > 13)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp inválido. Use apenas números com DDD (10 a 13 dígitos).',
      });
    }

    const existe = await db.get('SELECT id FROM empresa WHERE id = 1');

    if (existe) {
      await db.exec(
        `UPDATE empresa SET
           nome_empresa          = COALESCE(?, nome_empresa),
           nome_fantasia         = COALESCE(?, nome_fantasia),
           whatsapp              = COALESCE(?, whatsapp),
           instagram             = COALESCE(?, instagram),
           endereco              = COALESCE(?, endereco),
           cidade                = COALESCE(?, cidade),
           uf                    = COALESCE(?, uf),
           horario_funcionamento = COALESCE(?, horario_funcionamento),
           taxa_entrega_padrao   = COALESCE(?, taxa_entrega_padrao),
           logo_url              = COALESCE(?, logo_url),
           mensagem_whatsapp     = COALESCE(?, mensagem_whatsapp),
           atualizado_em         = now()
         WHERE id = 1`,
        [
          nome_empresa          || null,
          nome_fantasia         || null,
          wpp                   || null,
          instagram             || null,
          endereco              || null,
          cidade                || null,
          uf                    ? String(uf).toUpperCase().slice(0, 2) : null,
          horario_funcionamento || null,
          taxa_entrega_padrao   != null ? parseFloat(taxa_entrega_padrao) : null,
          logo_url              || null,
          mensagem_whatsapp     || null,
        ]
      );
    } else {
      await db.exec(
        `INSERT INTO empresa
           (id, nome_empresa, nome_fantasia, whatsapp, instagram, endereco, cidade, uf,
            horario_funcionamento, taxa_entrega_padrao, logo_url, mensagem_whatsapp)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          nome_empresa          || null,
          nome_fantasia         || null,
          wpp                   || null,
          instagram             || null,
          endereco              || null,
          cidade                || null,
          uf                    ? String(uf).toUpperCase().slice(0, 2) : null,
          horario_funcionamento || null,
          taxa_entrega_padrao   != null ? parseFloat(taxa_entrega_padrao) : null,
          logo_url              || null,
          mensagem_whatsapp     || null,
        ]
      );
    }

    const atualizado = await db.get('SELECT * FROM empresa WHERE id = 1');
    res.json({ success: true, data: atualizado });
  } catch (err) {
    console.error('[empresa.update]', err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { getEmpresa, updateEmpresa };
