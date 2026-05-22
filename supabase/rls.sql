-- ============================================================
--  Tereré Mix — Row Level Security (RLS)
--  Execute no Supabase SQL Editor: supabase.com → SQL Editor
--
--  RESUMO DO MODELO DE ACESSO:Q
--  • produtos          → leitura pública; escrita somente admin (via API)
--  • pedidos           → inserção pública (checkout); leitura/escrita via API
--  • itens_pedido      → acesso apenas via API (backend)
--  • estoque_mov.      → acesso apenas via API (backend)
--  • coupons           → validação pública; CRUD somente admin (via API)
--  • promocoes         → leitura pública; escrita somente admin (via API)
--  • horarios_funcion. → leitura pública; escrita somente admin (via API)
--
--  IMPORTANTE: o backend usa a DATABASE_URL (role postgres/service_role)
--  e portanto sempre passa pelo RLS. O anon key só acessa o que as
--  policies abaixo permitem.
-- ============================================================

-- ── Habilitar RLS em todas as tabelas ──────────────────────
ALTER TABLE produtos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido           ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacao   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE promocoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_funcionamento ENABLE ROW LEVEL SECURITY;

-- ── Remover policies antigas (idempotente) ─────────────────
DROP POLICY IF EXISTS "anon lê produtos ativos"       ON produtos;
DROP POLICY IF EXISTS "anon lê promoções ativas"      ON promocoes;
DROP POLICY IF EXISTS "anon lê horários"              ON horarios_funcionamento;
DROP POLICY IF EXISTS "anon sem acesso pedidos"       ON pedidos;
DROP POLICY IF EXISTS "anon sem acesso itens"         ON itens_pedido;
DROP POLICY IF EXISTS "anon sem acesso estoque_mov"   ON estoque_movimentacao;
DROP POLICY IF EXISTS "anon sem acesso coupons"       ON coupons;

-- ============================================================
--  PRODUTOS — leitura pública, sem escrita direta
-- ============================================================
CREATE POLICY "anon lê produtos ativos"
  ON produtos FOR SELECT
  TO anon
  USING (ativo = true);

-- ============================================================
--  PEDIDOS — bloqueado via anon key (acesso só pelo backend)
--  O backend usa service_role/postgres que bypassa RLS.
-- ============================================================
-- (nenhuma policy = ninguém via anon key acessa)

-- ============================================================
--  ITENS_PEDIDO — bloqueado via anon key
-- ============================================================
-- (nenhuma policy = ninguém via anon key acessa)

-- ============================================================
--  ESTOQUE_MOVIMENTACAO — bloqueado via anon key
-- ============================================================
-- (nenhuma policy = ninguém via anon key acessa)

-- ============================================================
--  COUPONS — bloqueado via anon key (validação é feita pelo backend)
-- ============================================================
-- (nenhuma policy = ninguém via anon key acessa)

-- ============================================================
--  PROMOÇÕES — leitura pública
-- ============================================================
CREATE POLICY "anon lê promoções ativas"
  ON promocoes FOR SELECT
  TO anon
  USING (
    ativo = true
    AND (data_inicio IS NULL OR data_inicio <= CURRENT_DATE)
    AND (data_fim    IS NULL OR data_fim    >= CURRENT_DATE)
  );

-- ============================================================
--  HORÁRIOS — leitura pública
-- ============================================================
CREATE POLICY "anon lê horários"
  ON horarios_funcionamento FOR SELECT
  TO anon
  USING (true);

-- ============================================================
--  STORAGE — bucket "produtos"
--  Execute APÓS criar o bucket no painel Supabase → Storage
-- ============================================================
DROP POLICY IF EXISTS "Leitura pública bucket produtos" ON storage.objects;
DROP POLICY IF EXISTS "Upload admin bucket produtos"    ON storage.objects;
DROP POLICY IF EXISTS "Update admin bucket produtos"   ON storage.objects;
DROP POLICY IF EXISTS "Delete admin bucket produtos"   ON storage.objects;

CREATE POLICY "Leitura pública bucket produtos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos');

CREATE POLICY "Upload admin bucket produtos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produtos');

CREATE POLICY "Update admin bucket produtos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'produtos');

CREATE POLICY "Delete admin bucket produtos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'produtos');
