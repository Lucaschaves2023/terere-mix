/* ============================================
   Tereré Mix — Mini Login (módulo reutilizável)
   Injeta HTML + CSS dinamicamente em qualquer página.
   Uso: MiniLogin.init('btn-id')  → botão de trigger
        MiniLogin.abrir(onSave)   → abre o modal
        MiniLogin.fechar()        → fecha o modal
   ============================================ */

const MiniLogin = (() => {
  let _onSave = null;

  /* ── CSS ────────────────────────────────── */
  function _injectCSS() {
    if (document.querySelector('style[data-mini-login]')) return;
    const s = document.createElement('style');
    s.dataset.miniLogin = '1';
    s.textContent = `
      .ml-avatar{display:inline-flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.25);
        color:#fff;font-size:.72rem;font-weight:800;border:2px solid rgba(255,255,255,.55);}
      .ml-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;
        opacity:0;pointer-events:none;transition:opacity .25s ease;}
      .ml-overlay.open{opacity:1;pointer-events:all;}
      .ml-sheet{position:absolute;bottom:0;left:0;right:0;background:#fff;
        border-radius:20px 20px 0 0;padding:0 1.25rem 2.5rem;max-height:88vh;
        overflow-y:auto;transform:translateY(100%);
        transition:transform .32s cubic-bezier(.4,0,.2,1);}
      .ml-overlay.open .ml-sheet{transform:translateY(0);}
      .ml-handle{width:38px;height:4px;background:#e5e7eb;border-radius:2px;margin:14px auto 20px;}
      .ml-header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.5rem;}
      .ml-title{font-size:1.05rem;font-weight:700;color:#0B3D2E;margin:0;line-height:1.3;}
      .ml-close{flex-shrink:0;width:30px;height:30px;background:#f3f4f6;border:none;
        border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;
        color:#6b7280;padding:0;}
      .ml-subtitle{font-size:.82rem;color:#6b7280;margin:0 0 1.4rem;line-height:1.5;}
      .ml-field{margin-bottom:1rem;}
      .ml-field label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:.4rem;}
      .ml-field input{width:100%;padding:13px 14px;border:1.5px solid #e5e7eb;border-radius:10px;
        font-size:.95rem;color:#111;background:#fafafa;box-sizing:border-box;outline:none;
        transition:border-color .18s;}
      .ml-field input:focus{border-color:#0B3D2E;background:#fff;}
      .ml-erro{font-size:.78rem;color:#c0392b;min-height:1.1em;margin:-.5rem 0 .6rem;}
      .ml-btn-submit{width:100%;padding:15px;background:#0B3D2E;color:#fff;border:none;
        border-radius:12px;font-size:.95rem;font-weight:700;cursor:pointer;
        letter-spacing:.01em;transition:opacity .15s;}
      .ml-btn-submit:active{opacity:.85;}
      .ml-user-card{display:flex;align-items:center;gap:1rem;padding:1rem 1.1rem;
        background:#f0faf5;border-radius:14px;border:1.5px solid #bbf7d0;margin-bottom:1rem;}
      .ml-user-avatar{width:46px;height:46px;border-radius:50%;background:#0B3D2E;color:#fff;
        display:flex;align-items:center;justify-content:center;font-size:1.15rem;
        font-weight:800;flex-shrink:0;}
      .ml-user-name{font-weight:700;font-size:.95rem;color:#0B3D2E;margin:0 0 .15rem;}
      .ml-user-phone{font-size:.82rem;color:#6b7280;margin:0;}
      .ml-btn-editar{width:100%;padding:12px;background:none;border:1.5px solid #e5e7eb;
        border-radius:10px;font-size:.875rem;color:#374151;font-weight:500;cursor:pointer;
        margin-bottom:.75rem;}
      .ml-link-pedidos{display:block;text-align:center;color:#0B3D2E;font-size:.875rem;
        font-weight:600;text-decoration:none;padding:.5rem;}
    `;
    document.head.appendChild(s);
  }

  /* ── HTML ───────────────────────────────── */
  function _injectHTML() {
    if (document.getElementById('ml-overlay')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="ml-overlay" id="ml-overlay" aria-hidden="true">
        <div class="ml-sheet" id="ml-sheet" role="dialog" aria-modal="true" aria-labelledby="ml-title">
          <div class="ml-handle"></div>
          <div class="ml-header">
            <h2 class="ml-title" id="ml-title">Olá! Como você se chama?</h2>
            <button class="ml-close" id="ml-close" aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <p class="ml-subtitle" id="ml-subtitle">
            Só precisamos do seu nome e WhatsApp — sem senha, sem cadastro.
          </p>
          <form id="ml-form" novalidate>
            <div class="ml-field">
              <label for="ml-nome">Seu nome</label>
              <input type="text" id="ml-nome" placeholder="Ex: João Silva"
                     autocomplete="name" inputmode="text">
            </div>
            <div class="ml-field">
              <label for="ml-fone">WhatsApp</label>
              <input type="tel" id="ml-fone" placeholder="(92) 99999-9999"
                     autocomplete="tel" inputmode="tel">
            </div>
            <p class="ml-erro" id="ml-erro" role="alert"></p>
            <button type="submit" class="ml-btn-submit" id="ml-submit">Começar a pedir 🧉</button>
          </form>
          <div id="ml-identified" hidden>
            <div class="ml-user-card">
              <div class="ml-user-avatar" id="ml-user-avatar"></div>
              <div>
                <p class="ml-user-name" id="ml-user-name"></p>
                <p class="ml-user-phone" id="ml-user-phone"></p>
              </div>
            </div>
            <button class="ml-btn-editar" id="ml-editar">Editar dados</button>
            <a href="pedidos.html" class="ml-link-pedidos">Ver meus pedidos →</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap.firstElementChild);

    document.getElementById('ml-close').addEventListener('click', fechar);
    document.getElementById('ml-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('ml-overlay')) fechar();
    });
    document.getElementById('ml-form').addEventListener('submit', _handleSubmit);
    document.getElementById('ml-editar').addEventListener('click', _mostrarForm);
  }

  /* ── Submit ─────────────────────────────── */
  function _handleSubmit(e) {
    e.preventDefault();
    const nome = document.getElementById('ml-nome').value.trim();
    const tel  = document.getElementById('ml-fone').value.trim();
    const erro = document.getElementById('ml-erro');

    if (!nome) { erro.textContent = 'Informe seu nome.'; return; }
    if (tel.replace(/\D/g, '').length < 10) {
      erro.textContent = 'Informe um WhatsApp válido (mínimo 10 dígitos).';
      return;
    }
    erro.textContent = '';

    localStorage.setItem('cliente_nome', nome);
    localStorage.setItem('cliente_whatsapp', tel);
    _atualizarBotao();
    fechar();

    if (typeof _onSave === 'function') { _onSave(); _onSave = null; }
  }

  /* ── Formulário de edição ───────────────── */
  function _mostrarForm() {
    document.getElementById('ml-identified').hidden = true;
    document.getElementById('ml-form').hidden       = false;
    document.getElementById('ml-subtitle').hidden   = false;
    document.getElementById('ml-title').textContent  = 'Atualizar seus dados';
    document.getElementById('ml-submit').textContent = 'Salvar';
    document.getElementById('ml-nome').value = localStorage.getItem('cliente_nome') || '';
    document.getElementById('ml-fone').value = localStorage.getItem('cliente_whatsapp') || '';
    document.getElementById('ml-erro').textContent = '';
  }

  /* ── Atualiza ícone/avatar no botão ─────── */
  function _atualizarBotao() {
    const nome   = localStorage.getItem('cliente_nome');
    const icon   = document.getElementById('ml-icon-person');
    const avatar = document.getElementById('ml-avatar');
    if (!icon || !avatar) return;
    if (nome) {
      icon.style.display = 'none';
      avatar.hidden      = false;
      avatar.textContent = nome.charAt(0).toUpperCase();
    } else {
      icon.style.display = '';
      avatar.hidden      = true;
    }
  }

  /* ════════════════════════════════════════
     API pública
  ════════════════════════════════════════ */

  function init(btnId, onSave) {
    _injectCSS();
    _injectHTML();
    _atualizarBotao();
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', () => abrir(onSave));
  }

  function abrir(onSave) {
    _injectCSS();
    _injectHTML();
    _onSave = onSave || null;

    const nome = localStorage.getItem('cliente_nome');
    const tel  = localStorage.getItem('cliente_whatsapp');

    if (nome && tel) {
      document.getElementById('ml-title').textContent       = 'Seu perfil';
      document.getElementById('ml-subtitle').hidden         = true;
      document.getElementById('ml-form').hidden             = true;
      document.getElementById('ml-identified').hidden       = false;
      document.getElementById('ml-user-avatar').textContent = nome.charAt(0).toUpperCase();
      document.getElementById('ml-user-name').textContent   = nome;
      document.getElementById('ml-user-phone').textContent  = tel;
    } else {
      document.getElementById('ml-title').textContent     = 'Olá! Como você se chama?';
      document.getElementById('ml-subtitle').hidden       = false;
      document.getElementById('ml-form').hidden           = false;
      document.getElementById('ml-identified').hidden     = true;
      document.getElementById('ml-submit').textContent    = 'Começar a pedir 🧉';
      document.getElementById('ml-erro').textContent      = '';
      document.getElementById('ml-nome').value            = '';
      document.getElementById('ml-fone').value            = '';
    }

    const overlay = document.getElementById('ml-overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.getElementById('ml-nome');
      if (input && !input.closest('[hidden]')) input.focus();
    }, 350);
  }

  function fechar() {
    const overlay = document.getElementById('ml-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  return { init, abrir, fechar };
})();
