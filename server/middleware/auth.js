/* ============================================================
   Tereré Mix — Middleware de Autenticação Admin
   Verifica o JWT do Supabase em rotas protegidas.

   Estratégia (em ordem de prioridade):
   1. Verificação local com SUPABASE_JWT_SECRET (rápida, sem rede).
      Usada quando a variável está configurada. Se falhar, tenta #2.
   2. Verificação via Supabase REST API /auth/v1/user.
      Não precisa do JWT secret — funciona com qualquer algoritmo
      (HS256 ou RS256) e com o novo formato de chaves sb_publishable_*.

   Segurança (fail-closed):
   - Token ausente ou inválido             → 401
   - SUPABASE_URL/ANON_KEY não configurados → 503 (nunca libera)
   - Erro de rede com a API do Supabase     → 503
   ============================================================ */

const jwt = require('jsonwebtoken');

module.exports = async function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso restrito. Faça login no painel admin.',
    });
  }

  const token = header.slice(7);

  // ── Caminho 1: verificação local (sem latência de rede) ───────────
  if (process.env.SUPABASE_JWT_SECRET) {
    try {
      jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      return next();
    } catch (jwtErr) {
      // Falha pode ser: token expirado, assinatura errada, algoritmo RS256.
      // Não retorna 401 aqui — tenta a verificação via API primeiro.
      console.warn(`[AUTH] JWT local inválido (${jwtErr.message}) — verificando via Supabase API.`);
    }
  }

  // ── Caminho 2: verificação via Supabase REST API ──────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('[AUTH] SUPABASE_URL ou SUPABASE_ANON_KEY não configurados — rotas admin indisponíveis.');
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível. Contate o suporte.',
    });
  }

  try {
    const resp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
    });

    if (resp.ok) {
      return next();
    }

    console.warn(`[AUTH] Supabase rejeitou o token: HTTP ${resp.status}`);
    return res.status(401).json({
      success: false,
      message: 'Sessão inválida ou expirada. Faça login novamente.',
    });
  } catch (netErr) {
    console.error('[AUTH] Erro ao verificar token via Supabase API:', netErr.message);
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível. Contate o suporte.',
    });
  }
};
