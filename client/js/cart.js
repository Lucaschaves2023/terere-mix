/* ============================================
   TERERÉ MIX — Cart Manager
   Gerencia o carrinho via localStorage
   ============================================ */

const CART_KEY = 'terere_mix_cart';

const Cart = {

  /* ── Leitura / Escrita ───────────────────── */

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    this.updateBadge();
    this._dispatch(items);
  },

  /* ── Mutações ────────────────────────────── */

  add(product) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ ...product, quantity: 1 });
    }
    this.save(items);
    this.showToast(`${product.name} adicionado! 🧉`);
  },

  remove(id) {
    const items = this.getItems().filter(i => i.id !== id);
    this.save(items);
  },

  setQuantity(id, qty) {
    if (qty <= 0) { this.remove(id); return; }
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (item) { item.quantity = qty; this.save(items); }
  },

  clear() {
    localStorage.removeItem(CART_KEY);
    this.updateBadge();
    this._dispatch([]);
  },

  /* ── Cálculos ────────────────────────────── */

  getTotalCount() {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((sum, i) => sum + (i.price * i.quantity), 0);
  },

  formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  /* ── UI — Badge ──────────────────────────── */

  updateBadge() {
    const count = this.getTotalCount();
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = count > 9 ? '9+' : count;
      badge.hidden = count === 0;
    });
  },

  /* ── UI — Toast ──────────────────────────── */

  showToast(message) {
    const existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('cart-toast--visible'));
    });

    setTimeout(() => {
      toast.classList.remove('cart-toast--visible');
      setTimeout(() => toast.remove(), 350);
    }, 2200);
  },

  /* ── Binding — Botões + ──────────────────── */

  bindProductButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      // Evita duplicar listeners
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('[data-product-id]');
        if (!card) return;

        const product = {
          id:    card.dataset.productId,
          name:  card.dataset.productName,
          price: parseFloat(card.dataset.productPrice),
          image: card.dataset.productImage || '',
        };

        Cart.add(product);

        // Animação do botão
        btn.classList.add('is-added');
        btn.setAttribute('aria-label', 'Adicionado!');
        const original = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => {
          btn.classList.remove('is-added');
          btn.textContent = original;
          btn.removeAttribute('aria-label');
        }, 900);
      });
    });
  },

  /* ── Init ────────────────────────────────── */

  init() {
    this.updateBadge();
    this.bindProductButtons();

    // Re-bind ao navegar em SPA (caso futuro)
    document.addEventListener('cartPageReady', () => this.bindProductButtons());
  },

  /* ── Interno ─────────────────────────────── */

  _dispatch(items) {
    document.dispatchEvent(new CustomEvent('cartChange', {
      detail: { items, count: this.getTotalCount() }
    }));
  },
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
