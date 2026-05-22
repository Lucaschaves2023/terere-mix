/* ============================================
   Tereré Mix — App.js (Home)
   Carrega produtos, horários e pedidos anteriores
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Mini Login ──────────────────────────────
  initMiniLogin();

  // ── Botão compartilhar ──────────────────────
  initShareButton('btn-share');

  // ── Horário de funcionamento dinâmico ───────
  await renderHorarioDinamico();

  // ── Renderiza promoções relâmpago ───────────
  await renderPromocoesHome();

  // ── Renderiza seção "Os mais pedidos" ───────
  await renderDestaques();

  // ── Renderiza "Peça de novo" dinâmico ───────
  await renderReordenar();

  // ── Renderiza cardápio por categoria ────────
  await renderCardapio();
});

/* ── Compartilhar ─────────────────────────── */
function initShareButton(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const url  = window.location.origin;
    const data = {
      title: 'Tereré Mix',
      text:  'Tereré, ervas e salgados fresquinhos! Peça pelo cardápio digital 🧉',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        showShareToast();
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        showShareToast();
      } catch { /* clipboard bloqueado */ }
    }
  });
}

function showShareToast() {
  const t = document.createElement('div');
  t.textContent = 'Link copiado para compartilhar.';
  Object.assign(t.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%)',
    background: '#0B3D2E', color: '#fff',
    padding: '10px 20px', borderRadius: '8px',
    fontSize: '.85rem', fontWeight: '600',
    zIndex: '9999', whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,.25)',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/* ── Horário dinâmico ─────────────────────── */
async function renderHorarioDinamico() {
  try {
    const horarios = await API.getHorarios();
    const info     = calcularStatus(horarios);

    const storeInfo = document.querySelector('.store-info__details');
    if (storeInfo) {
      storeInfo.innerHTML = info.aberto
        ? `<span style="color:#1a7a4a;font-weight:600;">● Aberto</span> até às ${fmtHora(info.hora_fecha)} <span>•</span> Pedido mín. R$ 5,00`
        : `<span style="color:#c0392b;">● Fechado</span> — ${info.proximoTexto} <span>•</span> Pedido mín. R$ 5,00`;
    }

    const alertBanner = document.getElementById('alert-closed');
    if (alertBanner) {
      if (info.aberto) {
        alertBanner.style.display = 'none';
      } else {
        alertBanner.textContent = `Loja fechada. ${info.proximoTexto}`;
        alertBanner.style.display = '';
      }
    }
  } catch { /* não bloqueia a home */ }
}

function calcularStatus(horarios) {
  const agora     = new Date();
  const diaSemana = agora.getDay();
  const minAtual  = agora.getHours() * 60 + agora.getMinutes();

  const hoje = horarios.find(h => h.dia_semana === diaSemana);

  if (hoje && hoje.aberto && hoje.hora_abre && hoje.hora_fecha) {
    const minAbre  = parseMins(hoje.hora_abre);
    const minFecha = parseMins(hoje.hora_fecha);
    if (minAtual >= minAbre && minAtual < minFecha) {
      return { aberto: true, hora_fecha: hoje.hora_fecha };
    }
    if (minAtual < minAbre) {
      return { aberto: false, proximoTexto: `Abre hoje às ${fmtHora(hoje.hora_abre)}` };
    }
  }

  // Procura próximo dia com funcionamento
  for (let d = 1; d <= 7; d++) {
    const prox = horarios.find(h => h.dia_semana === (diaSemana + d) % 7);
    if (prox && prox.aberto && prox.hora_abre) {
      const nome = prox.nome_dia || prox.dia_semana;
      return { aberto: false, proximoTexto: `Abre ${d === 1 ? 'amanhã' : nome} às ${fmtHora(prox.hora_abre)}` };
    }
  }

  return { aberto: false, proximoTexto: 'Fechado no momento' };
}

function parseMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmtHora(hhmm) {
  if (!hhmm) return '';
  return hhmm.replace(':', 'h');
}

/* ── Helpers de formatação e segurança ───── */
function fmtBRL(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

function produtoCardHTML(p, variant = 'grid') {
  const estoqueBadge = p.estoque === 0
    ? `<span class="badge-esgotado">Esgotado</span>` : '';

  if (variant === 'grid') {
    return `
      <article class="product-card ${p.estoque === 0 ? 'product-card--esgotado' : ''}"
               id="product-${p.id}"
               data-product-id="${p.id}"
               data-product-name="${escapeHTML(p.nome)}"
               data-product-price="${p.preco}"
               data-product-image="${escapeHTML(p.imagem || '')}">
        ${estoqueBadge}
        <img src="${escapeHTML(p.imagem || 'assets/images/terere-mix.png')}"
             alt="${escapeHTML(p.nome)}" class="product-card__image" loading="lazy">
        <button class="btn-add-cart" data-add-to-cart
                aria-label="Adicionar ${escapeHTML(p.nome)}"
                ${p.estoque === 0 ? 'disabled' : ''}>+</button>
        <p class="product-card__name">${escapeHTML(p.nome)}</p>
        <p class="product-card__price">${fmtBRL(p.preco)}</p>
      </article>`;
  }

  // variant === 'list' (menu-item)
  return `
    <article class="menu-item ${p.estoque === 0 ? 'product-card--esgotado' : ''}"
             id="item-${p.id}"
             data-product-id="${p.id}"
             data-product-name="${escapeHTML(p.nome)}"
             data-product-price="${p.preco}"
             data-product-image="${escapeHTML(p.imagem || '')}">
      <div class="menu-item__info">
        <p class="menu-item__name">${escapeHTML(p.nome)}</p>
        ${p.descricao ? `<p class="menu-item__desc">${escapeHTML(p.descricao)}</p>` : ''}
        <p class="menu-item__price">${fmtBRL(p.preco)}</p>
      </div>
      <img src="${escapeHTML(p.imagem || 'assets/images/terere-mix.png')}"
           alt="${escapeHTML(p.nome)}" class="menu-item__image" loading="lazy">
      <button class="btn-add-cart" data-add-to-cart
              aria-label="Adicionar ${escapeHTML(p.nome)}"
              ${p.estoque === 0 ? 'disabled' : ''}>+</button>
    </article>`;
}

/* ── Renderiza "Os mais pedidos" ─────────── */
async function renderDestaques() {
  const container = document.getElementById('popular-products');
  if (!container) return;

  container.innerHTML = `<div class="loading-shimmer" style="grid-column:1/-1;height:120px;border-radius:12px;"></div>`;

  try {
    const produtos = await API.getProdutos('Destaques');
    container.innerHTML = produtos.map(p => produtoCardHTML(p, 'grid')).join('');
    Cart.bindProductButtons();
  } catch (err) {
    container.innerHTML = `<p style="padding:1rem;color:var(--color-danger)">Erro ao carregar produtos: ${err.message}</p>`;
  }
}

/* ── Renderiza "Peça de novo" dinâmico ────── */
async function renderReordenar() {
  const section = document.querySelector('[aria-label="Peça de novo"]');
  const wrapper = document.getElementById('reorder-scroll');
  if (!section || !wrapper) return;

  const whatsapp = localStorage.getItem('cliente_whatsapp');
  if (!whatsapp) {
    section.style.display = 'none';
    return;
  }

  try {
    const pedidos = await API.getMeusPedidos(whatsapp);
    const recentes = (pedidos || []).filter(p => p.itens && p.itens.length > 0).slice(0, 4);

    if (!recentes.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    wrapper.innerHTML = recentes.map(p => {
      const itens = Array.isArray(p.itens) ? p.itens : [];
      const resumo = itens.slice(0, 2).map(i => `<span>${i.quantidade}</span> ${escapeHTML(i.nome_produto)}`).join('<br>');
      const itensData = encodeURIComponent(JSON.stringify(
        itens.map(i => ({
          id:    String(i.produto_id),
          name:  i.nome_produto,
          price: parseFloat(i.preco_unit || 0),
          image: '',
          qty:   i.quantidade || 1,
        }))
      ));
      return `
        <article class="reorder-card">
          <img src="assets/images/terere-mix.png" alt="Pedido #${p.id}"
               class="reorder-card__image" loading="lazy">
          <div class="reorder-card__info">
            <div class="reorder-card__items">${resumo}</div>
            <button class="reorder-card__action" data-reorder="${itensData}">
              Adicionar ao carrinho
            </button>
          </div>
        </article>`;
    }).join('');

    wrapper.querySelectorAll('[data-reorder]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const itens = JSON.parse(decodeURIComponent(btn.dataset.reorder));
          const cartItems = Cart.getItems();
          itens.forEach(item => {
            const existing = cartItems.find(c => c.id === item.id);
            if (existing) {
              existing.quantity += item.qty || 1;
            } else {
              cartItems.push({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: item.qty || 1 });
            }
          });
          Cart.save(cartItems);
          Cart.showToast(`${itens.length} item(s) adicionado(s)! 🧉`);
        } catch { /* silencioso */ }
      });
    });

  } catch {
    section.style.display = 'none';
  }
}

/* ── Renderiza cardápio completo por categorias ─ */
async function renderCardapio() {
  const wrapper = document.getElementById('cardapio-dinamico');
  if (!wrapper) return;

  wrapper.innerHTML = `<div class="loading-shimmer" style="height:200px;border-radius:12px;margin:1rem;"></div>`;

  try {
    const todos = await API.getProdutos();

    // Agrupa por categoria (excluindo Destaques, já mostrado acima)
    const categorias = {};
    for (const p of todos) {
      if (p.categoria === 'Destaques') continue;
      if (!categorias[p.categoria]) categorias[p.categoria] = [];
      categorias[p.categoria].push(p);
    }

    let html = '';
    for (const [cat, produtos] of Object.entries(categorias)) {
      html += `
        <section aria-label="${cat}">
          <h2 class="section-title"
              style="border-bottom:3px solid var(--color-primary);display:inline-block;margin-left:var(--space-lg);">
            ${cat}
          </h2>
          <div class="menu-grid" id="menu-${cat.toLowerCase().replace(/\s/g,'-')}">
            ${produtos.map(p => produtoCardHTML(p, 'list')).join('')}
          </div>
        </section>`;
    }

    wrapper.innerHTML = html || '<p style="padding:1rem;">Nenhum produto cadastrado.</p>';
    Cart.bindProductButtons();
  } catch (err) {
    wrapper.innerHTML = `<p style="padding:1rem;color:var(--color-danger)">Erro ao carregar cardápio: ${err.message}</p>`;
  }
}

/* ── Mini Login ───────────────────────────── */
function initMiniLogin() {
  MiniLogin.init('btn-mini-login', renderReordenar);
}

/* ── Promoções Relâmpago (Home) ───────────── */
async function renderPromocoesHome() {
  const wrapper = document.getElementById('promo-section-wrapper');
  const scroll  = document.getElementById('promo-scroll');
  if (!wrapper || !scroll) return;

  try {
    const promos = await API.getPromocoes();
    if (!promos || !promos.length) return;

    const produtos = await API.getProdutos();

    wrapper.style.display = '';
    scroll.innerHTML = promos.map(pr => {
      const img        = pr.imagem || 'assets/images/terere-mix.png';
      const deLabel    = pr.preco_original
        ? `<span class="promo-card__de">R$ ${parseFloat(pr.preco_original).toFixed(2).replace('.',',')}</span>` : '';
      const produtoDB  = pr.produto_id ? produtos.find(p => p.id == pr.produto_id) : null;
      const btnAttr    = produtoDB
        ? `data-product-id="${produtoDB.id}" data-product-name="${produtoDB.nome}" data-product-price="${produtoDB.preco}" data-product-image="${produtoDB.imagem || ''}" data-add-to-cart`
        : `disabled style="opacity:.5;cursor:default;"`;

      return `
        <div class="promo-card">
          <img src="${img}" alt="${pr.titulo}" class="promo-card__img" loading="lazy">
          <div class="promo-card__body">
            <p class="promo-card__titulo">${pr.titulo}</p>
            ${pr.descricao ? `<p class="promo-card__desc">${pr.descricao}</p>` : ''}
            <div class="promo-card__precos">
              ${deLabel}
              <span class="promo-card__por">R$ ${parseFloat(pr.preco_promocional).toFixed(2).replace('.',',')}</span>
            </div>
            <button class="promo-card__btn" ${btnAttr}>${produtoDB ? 'Adicionar' : 'Ver no cardápio'}</button>
          </div>
        </div>`;
    }).join('');

    Cart.bindProductButtons();
  } catch { /* promoções são opcionais */ }
}
