-- ============================================
--  Tereré Mix — Schema SQLite
-- ============================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Produtos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  descricao   TEXT,
  preco       REAL    NOT NULL CHECK(preco >= 0),
  categoria   TEXT    NOT NULL DEFAULT 'Geral',
  imagem      TEXT,
  estoque     INTEGER NOT NULL DEFAULT 0,
  ativo       INTEGER NOT NULL DEFAULT 1,
  criado_em   TEXT    DEFAULT (datetime('now', 'localtime'))
);

-- ── Pedidos ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo          TEXT NOT NULL DEFAULT 'online'
                  CHECK(tipo IN ('online','balcao')),
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK(status IN ('pendente','preparando','pronto','entregue','cancelado')),
  nome_cliente  TEXT,
  telefone      TEXT,
  endereco      TEXT,
  total         REAL NOT NULL CHECK(total >= 0),
  observacao    TEXT,
  criado_em     TEXT DEFAULT (datetime('now', 'localtime')),
  atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ── Itens do Pedido ──────────────────────────
CREATE TABLE IF NOT EXISTS itens_pedido (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id     INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id    INTEGER NOT NULL REFERENCES produtos(id),
  nome_produto  TEXT    NOT NULL,
  preco_unit    REAL    NOT NULL,
  quantidade    INTEGER NOT NULL CHECK(quantidade > 0)
);

-- ── Movimentações de Estoque ─────────────────
CREATE TABLE IF NOT EXISTS estoque_movimentacao (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id  INTEGER NOT NULL REFERENCES produtos(id),
  tipo        TEXT    NOT NULL CHECK(tipo IN ('entrada','saida')),
  quantidade  INTEGER NOT NULL CHECK(quantidade > 0),
  motivo      TEXT,
  criado_em   TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ── Índices ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_status    ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id   ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto_id    ON estoque_movimentacao(produto_id);
