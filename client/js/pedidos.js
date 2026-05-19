/* ============================================
   Tereré Mix — Pedidos.js
   Carrega e renderiza pedidos da API
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
  return `
    <article class="order-card" id="order-${p.id}">
      <div class="order-card__header">
        <div>
          <p class="order-card__number">Pedido #${p.id}</p>
          <p class="order-card__date">${fmtData(p.criado_em)}</p>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="order-card__items">
        ${p.resumo_itens || `<em style="color:var(--color-gray-500);font-size:.85rem;">Clique em detalhes para ver os itens</em>`}
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

  try {
    const pedidos = await API.getPedidos({ limit: 50 });

    if (!pedidos.length) {
      main.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p class="cart-empty__title">Nenhum pedido ainda</p>
          <p class="cart-empty__text">Seus pedidos aparecerão aqui após a finalização</p>
          <a href="index.html" class="btn btn--primary">Ver cardápio</a>
        </div>`;
      return;
    }

    main.innerHTML = pedidos.map(orderCardHTML).join('');
  } catch (err) {
    main.innerHTML = `
      <div style="padding:2rem;text-align:center;">
        <p style="color:var(--color-danger);font-weight:600;">Erro ao carregar pedidos</p>
        <p style="font-size:.85rem;color:var(--color-gray-500);margin-top:.5rem;">${err.message}</p>
        <p style="font-size:.8rem;color:var(--color-gray-400);margin-top:.5rem;">
          Verifique se o servidor está rodando em <code>http://localhost:3000</code>
        </p>
      </div>`;
  }
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
