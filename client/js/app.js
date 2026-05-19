/* ============================================
   Tereré Mix — App.js
   Carrega produtos da API e renderiza o cardápio
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Renderiza seção "Os mais pedidos" (Destaques) ──
  await renderDestaques();

  // ── Renderiza seções do cardápio por categoria ──
  await renderCardapio();
});

/* ── Helpers de formatação ────────────────── */
function fmtBRL(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function produtoCardHTML(p, variant = 'grid') {
  const estoqueBadge = p.estoque === 0
    ? `<span class="badge-esgotado">Esgotado</span>` : '';

  if (variant === 'grid') {
    return `
      <article class="product-card ${p.estoque === 0 ? 'product-card--esgotado' : ''}"
               id="product-${p.id}"
               data-product-id="${p.id}"
               data-product-name="${p.nome}"
               data-product-price="${p.preco}"
               data-product-image="${p.imagem || ''}">
        ${estoqueBadge}
        <img src="${p.imagem || 'assets/images/terere-mix.png'}"
             alt="${p.nome}" class="product-card__image" loading="lazy">
        <button class="btn-add-cart" data-add-to-cart
                aria-label="Adicionar ${p.nome}"
                ${p.estoque === 0 ? 'disabled' : ''}>+</button>
        <p class="product-card__name">${p.nome}</p>
        <p class="product-card__price">${fmtBRL(p.preco)}</p>
      </article>`;
  }

  // variant === 'list' (menu-item)
  return `
    <article class="menu-item ${p.estoque === 0 ? 'product-card--esgotado' : ''}"
             id="item-${p.id}"
             data-product-id="${p.id}"
             data-product-name="${p.nome}"
             data-product-price="${p.preco}"
             data-product-image="${p.imagem || ''}">
      <div class="menu-item__info">
        <p class="menu-item__name">${p.nome}</p>
        ${p.descricao ? `<p class="menu-item__desc">${p.descricao}</p>` : ''}
        <p class="menu-item__price">${fmtBRL(p.preco)}</p>
      </div>
      <img src="${p.imagem || 'assets/images/terere-mix.png'}"
           alt="${p.nome}" class="menu-item__image" loading="lazy">
      <button class="btn-add-cart" data-add-to-cart
              aria-label="Adicionar ${p.nome}"
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
