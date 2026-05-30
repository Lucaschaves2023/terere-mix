/* ============================================
   Tereré Mix — Express App
   Configura o app sem app.listen.
   Compatível com Vercel serverless e dev local.
   ============================================ */

require('dotenv').config();

// ── Validação de variáveis obrigatórias ───────
// SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios para auth.
// DATABASE_URL é opcional: se ausente, pg usa variáveis PG* do ambiente
// (injetadas automaticamente pelo Vercel Postgres quando conectado).
// SUPABASE_JWT_SECRET é opcional: auth.js usa REST API do Supabase se ausente.
const _REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const _missingVars   = _REQUIRED_VARS.filter(v => !process.env[v]);
if (!process.env.DATABASE_URL) {
  console.info('[ENV] DATABASE_URL não configurado — pg usará variáveis PG* do ambiente.');
}
if (!process.env.SUPABASE_JWT_SECRET) {
  console.info('[ENV] SUPABASE_JWT_SECRET não configurado — auth usará a API REST do Supabase (sem impacto funcional).');
}
if (_missingVars.length > 0) {
  const msg = `[ENV] Variáveis críticas ausentes: ${_missingVars.join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    console.error(msg);
    process.exit(1);
  } else {
    console.warn(msg);
  }
}

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app = express();

// ── Segurança: headers HTTP ───────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:  ["'self'", 'https://*.supabase.co', 'https://wa.me'],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// ── CORS: whitelist explícita ─────────────────
// VERCEL_URL é setado automaticamente pela Vercel com o domínio do deploy.
// Para domínio personalizado adicione ALLOWED_ORIGINS=https://seudominio.com.br
const _extraOrigins = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  ...(process.env.VERCEL_URL            ? [`https://${process.env.VERCEL_URL}`]            : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
];

const _isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl / mobile / SSR
    const devOk  = process.env.NODE_ENV !== 'production' && _isLocalhost(origin);
    const listOk = _extraOrigins.includes(origin);
    const ok     = devOk || listOk;
    cb(ok ? null : new Error('Origem não permitida'), ok);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────
const _rlMsg = (msg) => ({ success: false, message: msg });

// Endpoints públicos gerais: 40 req / 15 min
const _publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: _rlMsg('Muitas requisições. Tente novamente em alguns minutos.'),
});

// Login / tentativas de auth: 15 req / 15 min
const _loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: _rlMsg('Muitas tentativas. Aguarde 15 minutos.'),
});

// Validação de cupom — evita brute-force de códigos: 8 req / 15 min
const _cupomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: _rlMsg('Muitas tentativas de cupom. Aguarde 15 minutos.'),
});

// Consulta de pedidos por WhatsApp: 10 req / 15 min
const _meusPedidosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: _rlMsg('Muitas consultas. Tente novamente em alguns minutos.'),
});

// ── Logger de requisições (sem dados sensíveis) ─
app.use((req, res, next) => {
  const start  = Date.now();
  const reqId  = Math.random().toString(36).slice(2, 9);
  req._reqId   = reqId;
  res.on('finish', () => {
    const ms = Date.now() - start;
    const lvl = res.statusCode >= 500 ? 'ERROR'
              : res.statusCode >= 400 ? 'WARN'
              : 'INFO';
    if (req.path.startsWith('/api')) {
      console.log(`[${lvl}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms [${reqId}]`);
    }
  });
  next();
});

// ── Middleware ────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
const produtoRoutes   = require('./routes/produtoRoutes');
const pedidoRoutes    = require('./routes/pedidoRoutes');
const estoqueRoutes   = require('./routes/estoqueRoutes');
const cupomRoutes     = require('./routes/cupomRoutes');
const horarioRoutes   = require('./routes/horarioRoutes');
const promocaoRoutes  = require('./routes/promocaoRoutes');
const empresaRoutes   = require('./routes/empresaRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

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
//   POST /api/cupons/validar → público com rate limit estrito
//   Restante                 → admin (CRUD)
app.use('/api/cupons', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/validar') return _cupomLimiter(req, res, next);
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

// Empresa: GET é público, PUT exige admin
app.use('/api/empresa', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, empresaRoutes);

// ── Helpers de upload ─────────────────────────
const _ALLOWED_IMG_TYPES = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
const _MAX_UPLOAD_BYTES  = 4 * 1024 * 1024; // 4 MB

function _checkMagicBytes(buffer, mimeType) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 &&
           buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (mimeType === 'image/webp') {
    return buffer[0] === 0x52 && buffer[1] === 0x49 &&  // RIFF
           buffer[2] === 0x46 && buffer[3] === 0x46 &&
           buffer[8] === 0x57 && buffer[9] === 0x45 &&  // WEBP
           buffer[10] === 0x42 && buffer[11] === 0x50;
  }
  return false;
}

// Upload de imagem para promoções (admin)
app.post('/api/upload/promocao', requireAdmin, async (req, res) => {
  try {
    const { base64, mimeType, ext } = req.body;
    if (!base64 || !mimeType || !ext) {
      return res.status(400).json({ success: false, message: 'Dados de upload inválidos.' });
    }

    if (!_ALLOWED_IMG_TYPES.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'Formato não permitido. Use WebP, PNG ou JPEG.' });
    }

    const fileName  = `promo_${Date.now()}.${ext}`;
    const buffer    = Buffer.from(base64, 'base64');

    if (buffer.length > _MAX_UPLOAD_BYTES) {
      return res.status(400).json({ success: false, message: 'Imagem muito grande. Máximo: 4MB.' });
    }
    if (!_checkMagicBytes(buffer, mimeType)) {
      return res.status(400).json({ success: false, message: 'Arquivo inválido ou corrompido.' });
    }

    const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/PROMOCOES/${fileName}`;

    const resp = await fetch(uploadUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type':  mimeType,
      },
      body: buffer,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(500).json({ success: false, message: err.message || 'Erro no upload.' });
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/PROMOCOES/${fileName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload de imagem para produtos (admin)
app.post('/api/upload/produto', requireAdmin, async (req, res) => {
  try {
    const { base64, mimeType, ext } = req.body;
    if (!base64 || !mimeType || !ext) {
      return res.status(400).json({ success: false, message: 'Dados de upload inválidos.' });
    }

    if (!_ALLOWED_IMG_TYPES.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'Formato não permitido. Use WebP, PNG ou JPEG.' });
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > _MAX_UPLOAD_BYTES) {
      return res.status(400).json({ success: false, message: 'Imagem muito grande. Máximo: 4MB.' });
    }
    if (!_checkMagicBytes(buffer, mimeType)) {
      return res.status(400).json({ success: false, message: 'Arquivo inválido ou corrompido.' });
    }

    const fileName  = `produto_${Date.now()}.${ext}`;
    const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/produtos/${fileName}`;

    const resp = await fetch(uploadUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type':  mimeType,
      },
      body: buffer,
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return res.status(500).json({ success: false, message: errData.message || 'Erro no upload.' });
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/produtos/${fileName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Meus pedidos (público — filtra por WhatsApp, rate limit estrito)
app.get('/api/meus-pedidos', _meusPedidosLimiter, require('./controllers/pedidoController').meusPedidos);

// Clientes (admin — lista clientes únicos extraídos dos pedidos)
app.get('/api/admin/clientes', requireAdmin, require('./controllers/pedidoController').getClientes);

// Analytics: Dashboard e Relatórios (admin)
app.use('/api/admin/analytics', requireAdmin, analyticsRoutes);

// Health check — monitoramento e uptime
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    env:       process.env.NODE_ENV || 'development',
    version:   process.env.npm_package_version || '1.0.0',
  });
});

// ─────────────────────────────────────────────────────────────────────────────

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
