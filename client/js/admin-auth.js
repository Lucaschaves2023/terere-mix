/* ============================================================
   Tereré Mix — Admin Auth Guard
   Protege o painel admin com Supabase Auth.

   Este script deve ser carregado ANTES do script principal do
   admin.html e DEPOIS do Supabase JS (CDN).

   Fluxo:
   1. Busca configuração pública em /api/config
   2. Se Supabase não estiver configurado → abre painel sem auth (modo dev)
   3. Se configurado → verifica sessão ativa
   4. Sem sessão → redireciona para admin-login.html
   5. Com sessão → injeta token no cliente API, exibe o painel
   6. Expõe AdminAuth.ready() para o script principal aguardar
   ============================================================ */

// Promise que resolve quando a verificação de auth termina.
// O script principal do admin faz: await AdminAuth.ready()
let _resolveReady;
const _readyPromise = new Promise(resolve => { _resolveReady = resolve; });

const AdminAuth = {
  _supabase: null,

  /** Retorna uma Promise que resolve após a checagem de autenticação */
  ready: () => _readyPromise,

  /** Faz logout no Supabase e redireciona para o login */
  async logout() {
    if (this._supabase) await this._supabase.auth.signOut();
    window.API && window.API.clearToken();
    window.location.href = 'admin-login.html';
  },
};

window.AdminAuth = AdminAuth;

// ── Inicialização ──────────────────────────────────────────────
(async () => {
  try {
    // Busca as chaves públicas do Supabase pelo backend
    // (isso evita hardcodar valores no código-fonte)
    const cfg = await fetch('/api/config').then(r => r.json());

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      // Supabase não configurado: modo desenvolvimento (sem auth)
      console.warn(
        '[ADMIN AUTH] ⚠️  Supabase não configurado em .env — painel admin aberto sem autenticação.\n' +
        '             Configure SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_JWT_SECRET para ativar o login.'
      );
      document.querySelector('.admin-layout').style.display = 'flex';
      _resolveReady();
      return;
    }

    // Inicializa cliente Supabase com as chaves públicas
    AdminAuth._supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    // Verifica se já existe uma sessão salva (localStorage)
    const { data: { session } } = await AdminAuth._supabase.auth.getSession();

    if (!session) {
      // Sem sessão → vai para a tela de login
      window.location.href = 'admin-login.html';
      return;
    }

    // Sessão válida → injeta o token nos cabeçalhos da API e exibe o painel
    window.API && window.API.setToken(session.access_token);
    document.querySelector('.admin-layout').style.display = 'flex';
    _resolveReady();

    // Listener para renovação automática de token e logout externo
    AdminAuth._supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        // Token renovado automaticamente — atualiza o cliente API
        window.API && window.API.setToken(newSession.access_token);
      } else if (event === 'SIGNED_OUT') {
        // Sessão encerrada (logout em outra aba, token expirado etc.)
        window.location.href = 'admin-login.html';
      }
    });

  } catch (err) {
    // Erro de rede ou configuração — não bloqueia (pode estar offline em dev)
    console.error('[ADMIN AUTH] Erro na verificação de sessão:', err);
    document.querySelector('.admin-layout').style.display = 'flex';
    _resolveReady();
  }
})();
