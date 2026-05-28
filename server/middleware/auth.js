/* ============================================================
   Tereré Mix — Middleware de Autenticação Admin
   Verifica o JWT do Supabase em rotas protegidas.

   Como funciona:
   - O frontend envia o token no header: Authorization: Bearer <jwt>
   - Este middleware verifica o token usando o SUPABASE_JWT_SECRET
   - Se válido: deixa a requisição passar (next())
   - Se inválido ou ausente: retorna 401

   Segurança (fail-closed):
   - Se SUPABASE_JWT_SECRET não estiver configurado → retorna 503 (nunca libera)
   - Token ausente ou inválido → retorna 401
   ============================================================ */

const jwt = require('jsonwebtoken');

module.exports = function requireAdmin(req, res, next) {
  // Sem secret → fail-closed em qualquer ambiente (nunca libera sem autenticação)
  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('[AUTH] SUPABASE_JWT_SECRET não configurado — todas as rotas admin retornarão 503 até configurar o .env.');
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível. Contate o suporte.',
    });
  }

  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso restrito. Faça login no painel admin.',
    });
  }

  try {
    jwt.verify(header.slice(7), process.env.SUPABASE_JWT_SECRET);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Sessão inválida ou expirada. Faça login novamente.',
    });
  }
};
