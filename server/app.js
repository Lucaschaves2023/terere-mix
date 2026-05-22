/* ============================================
   Tereré Mix — Express App
   Configura o app sem app.listen.
   Compatível com Vercel serverless e dev local.
   ============================================ */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app = express();

// ── Segurança: headers HTTP ───────────────────
app.use(helmet({
  contentSecurityPolicy: false, // assets inline e CDN — evita quebrar o frontend
  crossOriginEmbedderPolicy: false,
}));

// ── CORS: apenas origem conhecida ─────────────
const _extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl / mobile / SSR
    const ok =
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      _extraOrigins.includes(origin);
    cb(ok ? null : new Error('Origem não permitida'), ok);
  },
  credentials: false,
}));

// ── Rate limiting — rotas públicas sensíveis ──
const _publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

const _loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Aguarde 15 minutos.' },
});

// ── Middleware ────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Servir frontend estático (/client) ────────
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── URLs limpas (sem .html) ───────────────────
// Ex: /cardapio → /client/cardapio.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});
app.get('/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.get('/:page', (req, res, next) => {
  const { page } = req.params;
  if (page.includes('.') || page.startsWith('api')) return next();
  const file = path.join(__dirname, '..', 'client', `${page}.html`);
  res.sendFile(file, err => { if (err) next(); });
});

// ── Rota pública: chaves do Supabase ──────────
// Expõe apenas as chaves PÚBLICAS (URL e anon key).
// DATABASE_URL e SUPABASE_JWT_SECRET NUNCA aparecem aqui.
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL     || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// ── Middleware de autenticação admin ──────────
const requireAdmin = require('./middleware/auth');

// ── Rotas ─────────────────────────────────────
const produtoRoutes  = require('./routes/produtoRoutes');
const pedidoRoutes   = require('./routes/pedidoRoutes');
const estoqueRoutes  = require('./routes/estoqueRoutes');
const cupomRoutes    = require('./routes/cupomRoutes');
const horarioRoutes  = require('./routes/horarioRoutes');
const promocaoRoutes = require('./routes/promocaoRoutes');

// Produtos: GET é público, escrita exige auth
app.use('/api/produtos', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, produtoRoutes);

// Pedidos:
//   POST /api/pedidos        → público (cliente finaliza pedido) com rate limit
//   GET  /api/pedidos/:id    → público (cliente rastreia pedido)
//   GET  /api/pedidos        → admin (lista todos)
//   PATCH /api/pedidos/:id/* → admin (atualiza status)
app.use('/api/pedidos', (req, res, next) => {
  if (req.method === 'POST') return _publicLimiter(req, res, next);
  if (req.method === 'GET' && /^\/\d+$/.test(req.path)) return next();
  requireAdmin(req, res, next);
}, pedidoRoutes);

// Estoque: somente admin
app.use('/api/estoque', requireAdmin, estoqueRoutes);

// Cupons:
//   POST /api/cupons/validar → público com rate limit (evita brute-force)
//   Restante                 → admin (CRUD)
app.use('/api/cupons', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/validar') return _publicLimiter(req, res, next);
  requireAdmin(req, res, next);
}, cupomRoutes);

// Horários: GET é público, PUT exige admin
app.use('/api/horarios', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, horarioRoutes);

// Promoções: GET é público, escrita exige admin
app.use('/api/promocoes', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, promocaoRoutes);

// Meus pedidos (público — filtra por WhatsApp)
app.get('/api/meus-pedidos', _publicLimiter, require('./controllers/pedidoController').meusPedidos);

// Clientes (admin — lista clientes únicos extraídos dos pedidos)
app.get('/api/admin/clientes', requireAdmin, require('./controllers/pedidoController').getClientes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 para rotas /api não encontradas
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada.' });
});

// Error handler global — nunca expõe detalhes internos
app.use((err, req, res, _next) => {
  console.error('[ERRO]', err.stack || err.message);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

module.exports = app;
