-- ============================================
--  Tereré Mix — Schema PostgreSQL (Supabase)
--  Execute no SQL Editor do Supabase:
--  Supabase → SQL Editor → New query → Cole e Execute
-- ============================================

-- ── Produtos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id        BIGSERIAL     PRIMARY KEY,
  nome      TEXT          NOT NULL,
  descricao TEXT,
  preco     NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  categoria TEXT          NOT NULL DEFAULT 'Geral',
  imagem    TEXT,
  estoque   INTEGER       NOT NULL DEFAULT 0,
  ativo     BOOLEAN       NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ   DEFAULT now()
);

-- ── Pedidos ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                  BIGSERIAL     PRIMARY KEY,
  tipo                TEXT          NOT NULL DEFAULT 'online'
                        CHECK (tipo IN ('online','balcao')),
  status              TEXT          NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','preparando','pronto','entregue','cancelado')),
  nome_cliente        TEXT,
  telefone            TEXT,
  endereco            TEXT,
  total               NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  observacao          TEXT,
  coupon_code         TEXT,
  discount_type       TEXT,
  discount_percentage NUMERIC(5,2),
  discount_amount     NUMERIC(10,2),
  subtotal_amount     NUMERIC(10,2),
  delivery_fee        NUMERIC(10,2),
  credit_surcharge    NUMERIC(10,2),
  payment_method      TEXT,
  criado_em           TIMESTAMPTZ   DEFAULT now(),
  atualizado_em       TIMESTAMPTZ   DEFAULT now()
);

-- ── Itens do Pedido ──────────────────────────
CREATE TABLE IF NOT EXISTS itens_pedido (
  id           BIGSERIAL     PRIMARY KEY,
  pedido_id    BIGINT        NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id   BIGINT        NOT NULL REFERENCES produtos(id),
  nome_produto TEXT          NOT NULL,
  preco_unit   NUMERIC(10,2) NOT NULL,
  quantidade   INTEGER       NOT NULL CHECK (quantidade > 0)
);

-- ── Movimentações de Estoque ─────────────────
CREATE TABLE IF NOT EXISTS estoque_movimentacao (
  id         BIGSERIAL   PRIMARY KEY,
  produto_id BIGINT      NOT NULL REFERENCES produtos(id),
  tipo       TEXT        NOT NULL CHECK (tipo IN ('entrada','saida')),
  quantidade INTEGER     NOT NULL CHECK (quantidade > 0),
  motivo     TEXT,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

-- ── Cupons ───────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id                  BIGSERIAL     PRIMARY KEY,
  name                TEXT          NOT NULL,
  code                TEXT          NOT NULL UNIQUE,
  type                TEXT          NOT NULL DEFAULT 'percent'
                        CHECK (type IN ('percent','fixed')),
  percentage          NUMERIC(5,2),
  fixed_amount        NUMERIC(10,2),
  active              BOOLEAN       NOT NULL DEFAULT true,
  expires_at          DATE,
  usage_limit         INTEGER,
  usage_count         INTEGER       NOT NULL DEFAULT 0,
  minimum_order_value NUMERIC(10,2),
  description         TEXT,
  created_at          TIMESTAMPTZ   DEFAULT now(),
  updated_at          TIMESTAMPTZ   DEFAULT now()
);

-- ── Índices ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_status    ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id   ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto_id    ON estoque_movimentacao(produto_id);
