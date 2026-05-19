/* ============================================================
   Tereré Mix — Middleware de Autenticação Admin
   Verifica o JWT do Supabase em rotas protegidas.

   Como funciona:
   - O frontend envia o token no header: Authorization: Bearer <jwt>
   - Este middleware verifica o token usando o SUPABASE_JWT_SECRET
   - Se válido: deixa a requisição passar (next())
   - Se inválido ou ausente: retorna 401

   Modo dev (sem SUPABASE_JWT_SECRET no .env):
   - Exibe aviso no console e deixa passar — nunca faça isso em produção!
   ============================================================ */

const jwt = require('jsonwebtoken');

module.exports = function requireAdmin(req, res, next) {
  // Se a variável de ambiente não estiver configurada, avisa e libera (modo dev)
  if (!process.env.SUPABASE_JWT_SECRET) {
    console.warn('[AUTH] ⚠️  SUPABASE_JWT_SECRET não configurado — rotas admin DESPROTEGIDAS. Configure o .env para ativar a autenticação.');
    return next();
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
