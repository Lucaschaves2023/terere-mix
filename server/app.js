/* ============================================
   Tereré Mix — Express App
   Configura o app sem app.listen.
   Compatível com Vercel serverless e dev local.
   ============================================ */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware ────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir frontend estático (/client) ────────
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── URLs limpas (sem .html) ───────────────────
// Ex: /cardapio → /client/cardapio.html
app.get('/', (req, res) => {
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
//   POST /api/pedidos        → público (cliente finaliza pedido)
//   GET  /api/pedidos/:id    → público (cliente rastreia pedido)
//   GET  /api/pedidos        → admin (lista todos)
//   PATCH /api/pedidos/:id/* → admin (atualiza status)
app.use('/api/pedidos', (req, res, next) => {
  if (req.method === 'POST') return next();
  if (req.method === 'GET' && /^\/\d+$/.test(req.path)) return next();
  requireAdmin(req, res, next);
}, pedidoRoutes);

// Estoque: somente admin
app.use('/api/estoque', requireAdmin, estoqueRoutes);

// Cupons:
//   POST /api/cupons/validar → público (checkout valida cupom)
//   Restante                 → admin (CRUD)
app.use('/api/cupons', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/validar') return next();
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
app.get('/api/meus-pedidos', require('./controllers/pedidoController').meusPedidos);

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

// Error handler global
app.use((err, req, res, _next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

module.exports = app;
