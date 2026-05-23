-- ============================================
--  Tereré Mix — Migration v2
--  Execute no SQL Editor do Supabase
--  (banco já existente — só adiciona campos)
-- ============================================

-- 1. Novos campos na tabela pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS numped BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT;

-- 2. Sequence para numped (número comercial, começa em #1001)
CREATE SEQUENCE IF NOT EXISTS pedidos_numped_seq START WITH 1001;

-- 3. Novos campos na tabela produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS sabor TEXT;

-- 4. Índices novos
CREATE INDEX IF NOT EXISTS idx_pedidos_numped ON pedidos(numped);
CREATE INDEX IF NOT EXISTS idx_pedidos_bairro ON pedidos(bairro);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);
CREATE INDEX IF NOT EXISTS idx_produtos_sabor ON produtos(sabor);
