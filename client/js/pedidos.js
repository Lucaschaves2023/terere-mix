/* ============================================
   Tereré Mix — Pedidos.js
   Carrega pedidos do cliente por WhatsApp
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await renderPedidos();

  // Destaca pedido novo se veio do checkout
  const params = new URLSearchParams(window.location.search);
  const novoId = params.get('novo');
  if (novoId) {
    setTimeout(() => {
      const el = document.getElementById(`order-${novoId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('order-card--novo');
      }
    }, 400);
  }
});

/* ── Status helpers ──────────────────────── */
const STATUS_LABEL = {
  pendente:   'Aguardando',
  preparando: 'Preparando',
  pronto:     'Pronto!',
  entregue:   'Entregue',
  cancelado:  'Cancelado',
};

const STATUS_CLASS = {
  pendente:   'status-badge--pending',
  preparando: 'status-badge--preparing',
  pronto:     'status-badge--ready',
  entregue:   'status-badge--done',
  cancelado:  'status-badge--cancelled',
};

function fmtBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtData(str) {
  if (!str) return '';
  const d = new Date(str.replace(' ', 'T'));
  return isNaN(d)
    ? str
    : `Em ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function orderCardHTML(p) {
  const statusLabel = STATUS_LABEL[p.status] || p.status;
  const statusClass = STATUS_CLASS[p.status] || '';

  // Resumo dos itens (da coluna itens que vem do JSON)
  let resumoItens = '';
  try {
    const itens = Array.isArray(p.itens) ? p.itens : (p.itens ? JSON.parse(p.itens) : []);
    if (itens && itens.length > 0) {
      resumoItens = itens.slice(0, 3).map(i => `${i.quantidade}× ${escapeHTML(i.nome_produto)}`).join(', ');
      if (itens.length > 3) resumoItens += ` e mais ${itens.length - 3}...`;
    }
  } catch {}

  return `
    <article class="order-card" id="order-${p.id}">
      <div class="order-card__header">
        <div>
          <p class="order-card__number">Pedido #${p.id}</p>
          <p class="order-card__date">${fmtData(p.criado_em)}</p>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="order-card__items" style="font-size:.8rem;color:var(--color-gray-600);margin:.4rem 0;">
        ${resumoItens || '<em style="color:var(--color-gray-500);font-size:.85rem;">Clique em detalhes para ver os itens</em>'}
      </div>
      <p class="order-card__total">${fmtBRL(p.total)}</p>
      <a href="detalhes-pedido.html?id=${p.id}"
         class="btn btn--outline" id="btn-details-${p.id}">Detalhes do pedido</a>
    </article>
  `;
}

/* ── Renderização principal ──────────────── */
async function renderPedidos() {
  const main = document.getElementById('pedidos-list');
  if (!main) return;

  const whatsapp = localStorage.getItem('cliente_whatsapp');

  if (!whatsapp) {
    renderSemIdentificacao(main);
    return;
  }

  mostrarCarregando(main);

  try {
    const pedidos = await API.getMeusPedidos(whatsapp);

    if (!pedidos || !pedidos.length) {
      main.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p class="cart-empty__title">Nenhum pedido encontrado</p>
          <p class="cart-empty__text" style="font-size:.8rem;">
            Número: <strong>${whatsapp}</strong>
          </p>
          <button class="btn btn--outline" style="margin-top:8px;font-size:.8rem;"
                  onclick="localStorage.removeItem('cliente_whatsapp');location.reload();">
            Usar outro WhatsApp
          </button>
          <a href="index.html" class="btn btn--primary" style="margin-top:8px;">Ver cardápio</a>
        </div>`;
      return;
    }

    main.innerHTML = `
      <div style="padding:.5rem var(--space-lg) .25rem;display:flex;align-items:center;justify-content:space-between;">
        <p style="font-size:.78rem;color:var(--color-gray-500);">📱 ${whatsapp}</p>
        <button style="font-size:.75rem;color:var(--color-gray-500);background:none;border:none;cursor:pointer;text-decoration:underline;"
                onclick="localStorage.removeItem('cliente_whatsapp');location.reload();">
          Trocar
        </button>
      </div>
      ${pedidos.map(orderCardHTML).join('')}
    `;
  } catch (err) {
    main.innerHTML = `
      <div style="padding:2rem;text-align:center;">
        <p style="color:var(--color-danger);font-weight:600;">Erro ao carregar pedidos</p>
        <p style="font-size:.85rem;color:var(--color-gray-500);margin-top:.5rem;">${err.message}</p>
        <button class="btn btn--outline" style="margin-top:1rem;"
                onclick="location.reload()">Tentar novamente</button>
      </div>`;
  }
}

function mostrarCarregando(main) {
  main.innerHTML = `
    <div style="padding:2rem;text-align:center;color:var(--color-gray-500);">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" style="animation:spin 1s linear infinite">
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".2"/>
        <path d="M21 12c0-4.97-4.03-9-9-9"/>
      </svg>
      <p style="margin-top:.5rem;font-size:.85rem;">Carregando pedidos...</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
}

function renderSemIdentificacao(main) {
  main.innerHTML = `
    <div class="cart-empty" style="padding:3rem 1.5rem 2rem;">
      <div class="cart-empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p class="cart-empty__title">Nenhum pedido ainda</p>
      <p class="cart-empty__text">Faça seu primeiro pedido e ele aparecerá aqui.</p>
      <a href="index.html" class="btn btn--primary" style="margin-top:1rem;display:inline-block;">
        Ver cardápio
      </a>
      <button id="btn-identificar-pedidos"
              style="display:block;margin:.75rem auto 0;background:none;border:none;
                     color:var(--color-primary,#0B3D2E);font-size:.85rem;font-weight:600;
                     cursor:pointer;text-decoration:underline;">
        Já fiz um pedido — identificar-me
      </button>
    </div>
  `;
  document.getElementById('btn-identificar-pedidos').addEventListener('click', () => {
    MiniLogin.abrir(() => renderPedidos());
  });
}

/* ── Estilos extras de status ────────────── */
const style = document.createElement('style');
style.textContent = `
  .status-badge--pending    { background:#fff3cd; color:#856404; }
  .status-badge--preparing  { background:#cce5ff; color:#004085; }
  .status-badge--ready      { background:#d4edda; color:#155724; }
  .status-badge--done       { background:#e2e3e5; color:#383d41; }
  .status-badge--cancelled  { background:#f8d7da; color:#721c24; }
  .order-card--novo {
    animation: pulse-card .8s ease 2;
    outline: 2px solid var(--color-primary);
  }
  @keyframes pulse-card {
    0%,100% { box-shadow: var(--shadow-card); }
    50%      { box-shadow: 0 0 0 6px rgba(29,161,242,.2); }
  }
`;
document.head.appendChild(style);
