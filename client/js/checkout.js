/* ============================================================
   Tereré Mix — Checkout.js v2
   Modal de finalização de pedido com:
   • Tipo: Delivery / Retirada / Comer no Local
   • Endereço completo (delivery)
   • Cálculo automático de taxa por bairro
   • Forma de pagamento com acréscimo de crédito
   • Cupom de desconto
   • Resumo financeiro em tempo real
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('btn-checkout');
  if (!checkoutBtn) return;
  checkoutBtn.addEventListener('click', abrirModalCheckout);
});

/* ── Estado local do modal ────────────────────────────────── */
let _cupomAtual   = null;    // objeto cupom validado
let _taxaEntrega  = 0;       // valor numérico da taxa
let _pagamentoId  = 'pix';   // forma de pagamento selecionada

/* ── Construção do Modal ──────────────────────────────────── */
function criarModal() {
  const bairrosOptions = DeliveryService.getTodosBairros()
    .map(b => `<option value="${b}">${b}</option>`)
    .join('');

  const tiposOptions = TIPOS_PEDIDO
    .map(t => `<option value="${t.id}">${t.label}</option>`)
    .join('');

  const pagamentosHTML = PagamentoService.getOpcoes().map((p, i) => `
    <label class="co-payment__option ${i === 0 ? 'co-payment__option--selected' : ''}" id="pay-label-${p.id}">
      <input type="radio" name="pagamento" value="${p.id}" ${i === 0 ? 'checked' : ''}>
      <span class="co-payment__label">${p.label}</span>
    </label>
  `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'checkout-overlay';
  overlay.innerHTML = `
    <div class="checkout-modal" id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="co-title">
      <div class="checkout-modal__header">
        <h2 class="checkout-modal__title" id="co-title">Finalizar Pedido</h2>
        <button class="checkout-modal__close" id="btn-close-modal" aria-label="Fechar">✕</button>
      </div>

      <form id="checkout-form" class="checkout-form" novalidate>

        <!-- Tipo de pedido -->
        <div class="checkout-form__group">
          <label for="co-tipo" class="checkout-form__label">Tipo de pedido *</label>
          <select id="co-tipo" name="tipo" class="checkout-form__select" required>
            ${tiposOptions}
          </select>
        </div>

        <!-- Dados do cliente -->
        <div class="checkout-form__group">
          <label for="co-nome" class="checkout-form__label">Seu nome *</label>
          <input type="text" id="co-nome" name="nome_cliente"
                 class="checkout-form__input" placeholder="Ex: Maria Silva" required autocomplete="name">
        </div>

        <div class="checkout-form__group">
          <label for="co-telefone" class="checkout-form__label">WhatsApp</label>
          <input type="tel" id="co-telefone" name="telefone"
                 class="checkout-form__input" placeholder="(92) 99999-9999" autocomplete="tel">
        </div>

        <!-- Bloco entrega (somente delivery) -->
        <div id="bloco-entrega" class="co-bloco">
          <div class="co-bloco__title">📍 Endereço de Entrega</div>

          <div class="checkout-form__group">
            <label for="co-bairro" class="checkout-form__label">Bairro *</label>
            <select id="co-bairro" name="bairro" class="checkout-form__select">
              <option value="">Selecione o bairro...</option>
              ${bairrosOptions}
            </select>
          </div>

          <div class="co-grid2">
            <div class="checkout-form__group">
              <label for="co-rua" class="checkout-form__label">Rua / Av.</label>
              <input type="text" id="co-rua" class="checkout-form__input" placeholder="Nome da rua">
            </div>
            <div class="checkout-form__group">
              <label for="co-numero" class="checkout-form__label">Número</label>
              <input type="text" id="co-numero" class="checkout-form__input" placeholder="123">
            </div>
          </div>

          <div class="checkout-form__group">
            <label for="co-complemento" class="checkout-form__label">Complemento</label>
            <input type="text" id="co-complemento" class="checkout-form__input" placeholder="Apto, Bloco, etc.">
          </div>

          <div class="checkout-form__group">
            <label for="co-referencia" class="checkout-form__label">Ponto de referência</label>
            <input type="text" id="co-referencia" class="checkout-form__input" placeholder="Ex: próximo ao mercado">
          </div>

          <!-- Exibe taxa calculada -->
          <div class="co-taxa-info" id="co-taxa-info">
            <span>🚗</span>
            <span id="co-taxa-label">Selecione o bairro para calcular a entrega</span>
          </div>

          <!-- Forma de pagamento (delivery only) -->
          <div class="co-bloco__title" style="margin-top:14px;">💳 Forma de Pagamento *</div>
          <div class="co-payment" id="co-payment">
            ${pagamentosHTML}
          </div>
        </div>

        <!-- Observações -->
        <div class="checkout-form__group">
          <label for="co-obs" class="checkout-form__label">Observações</label>
          <textarea id="co-obs" name="observacao"
                    class="checkout-form__textarea"
                    placeholder="Ex: sem cebola, bem gelado..." rows="2"></textarea>
        </div>

        <!-- Cupom de desconto -->
        <div class="co-cupom">
          <div class="co-cupom__title">🏷️ Cupom de Desconto</div>
          <div class="co-cupom__row">
            <input type="text" id="co-cupom-input" class="checkout-form__input co-cupom__input"
                   placeholder="Digite seu cupom" maxlength="30" autocomplete="off">
            <button type="button" class="co-cupom__btn" id="co-cupom-btn">Aplicar</button>
          </div>
          <p class="co-cupom__msg" id="co-cupom-msg"></p>
        </div>

        <!-- Resumo financeiro -->
        <div class="checkout-form__summary" id="co-resumo"></div>

        <button type="submit" class="btn btn--primary" id="btn-confirmar-pedido">
          Confirmar Pedido
        </button>
        <p class="checkout-form__error" id="checkout-error" hidden></p>

      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // ── Eventos internos ──────────────────────────────────────
  const tipoSel    = overlay.querySelector('#co-tipo');
  const bairroSel  = overlay.querySelector('#co-bairro');
  const payInputs  = overlay.querySelectorAll('input[name="pagamento"]');
  const cupomInput = overlay.querySelector('#co-cupom-input');
  const cupomBtn   = overlay.querySelector('#co-cupom-btn');

  // Tipo de pedido → mostra/oculta bloco entrega
  tipoSel.addEventListener('change', () => {
    const tipo = TIPOS_PEDIDO.find(t => t.id === tipoSel.value);
    const blocoEntrega = overlay.querySelector('#bloco-entrega');
    blocoEntrega.hidden = !tipo.requerEndereco;

    if (!tipo.requerEndereco) {
      _taxaEntrega = 0;
    }
    renderResumo(overlay.querySelector('#co-resumo'));
  });

  // Bairro → recalcula entrega
  bairroSel.addEventListener('change', () => {
    const resultado = DeliveryService.calcularTaxa(bairroSel.value);
    _taxaEntrega = resultado.taxa;

    const taxaLabel = overlay.querySelector('#co-taxa-label');
    taxaLabel.textContent = resultado.label || 'Selecione o bairro';
    taxaLabel.className   = resultado.zona === 'proxima' ? 'taxa-proxima' : resultado.zona === 'distante' ? 'taxa-distante' : '';

    renderResumo(overlay.querySelector('#co-resumo'));
  });

  // Pagamento → recalcula acréscimo
  payInputs.forEach(input => {
    input.addEventListener('change', () => {
      _pagamentoId = input.value;
      // atualiza visual de seleção
      overlay.querySelectorAll('.co-payment__option').forEach(el => el.classList.remove('co-payment__option--selected'));
      input.closest('.co-payment__option').classList.add('co-payment__option--selected');
      renderResumo(overlay.querySelector('#co-resumo'));
    });
  });

  // Cupom → aplicar
  cupomBtn.addEventListener('click', () => aplicarCupom(overlay));
  cupomInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aplicarCupom(overlay); } });

  // Fechar modal
  overlay.querySelector('#btn-close-modal').addEventListener('click', fecharModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

  // Form submit
  overlay.querySelector('#checkout-form').addEventListener('submit', handleSubmit);

  // Render inicial
  _cupomAtual  = null;
  _taxaEntrega = 0;
  _pagamentoId = 'pix';
  renderResumo(overlay.querySelector('#co-resumo'));

  requestAnimationFrame(() => overlay.classList.add('active'));
}

/* ── Aplicar Cupom ────────────────────────────────────────── */
async function aplicarCupom(overlay) {
  const input = overlay.querySelector('#co-cupom-input');
  const msg   = overlay.querySelector('#co-cupom-msg');
  const btn   = overlay.querySelector('#co-cupom-btn');

  btn.disabled    = true;
  btn.textContent = 'Validando...';
  msg.textContent = '';

  const subtotal = Cart.getSubtotal();
  const result   = await CupomService.validarOnline(input.value, subtotal);

  btn.disabled = false;

  if (result.valido) {
    _cupomAtual      = result.cupom;
    msg.textContent  = `✅ ${result.cupom.label} aplicado!`;
    msg.className    = 'co-cupom__msg co-cupom__msg--ok';
    input.readOnly   = true;
    btn.textContent  = 'Remover';
    btn.onclick      = () => removerCupom(overlay);
  } else {
    _cupomAtual     = null;
    msg.textContent = `❌ ${result.erro}`;
    msg.className   = 'co-cupom__msg co-cupom__msg--erro';
    btn.textContent = 'Aplicar';
  }
  renderResumo(overlay.querySelector('#co-resumo'));
}

function removerCupom(overlay) {
  _cupomAtual = null;
  const input = overlay.querySelector('#co-cupom-input');
  const msg   = overlay.querySelector('#co-cupom-msg');
  const btn   = overlay.querySelector('#co-cupom-btn');
  input.value    = '';
  input.readOnly = false;
  msg.textContent = '';
  btn.textContent = 'Aplicar';
  btn.onclick     = () => aplicarCupom(overlay);
  renderResumo(overlay.querySelector('#co-resumo'));
}

/* ── Render Resumo Financeiro ─────────────────────────────── */
function renderResumo(container) {
  const items     = Cart.getItems();
  const subtotal  = Cart.getSubtotal();
  const calc      = CheckoutCalculator.calcular({
    subtotal,
    taxaEntrega: _taxaEntrega,
    cupom:       _cupomAtual,
    pagamentoId: _pagamentoId,
  });

  const linhasItens = items.map(i => `
    <div class="checkout-form__summary-row">
      <span>${i.quantity}× ${i.name}</span>
      <span>${Cart.formatCurrency(i.price * i.quantity)}</span>
    </div>`).join('');

  const linhaEntrega = _taxaEntrega > 0 ? `
    <div class="checkout-form__summary-row">
      <span>🚗 Taxa de entrega</span>
      <span>${Cart.formatCurrency(calc.taxaEntrega)}</span>
    </div>` : '';

  const linhaDesconto = calc.desconto > 0 ? `
    <div class="checkout-form__summary-row co-summary-desconto">
      <span>🏷️ Desconto (${_cupomAtual?.codigo})</span>
      <span>− ${Cart.formatCurrency(calc.desconto)}</span>
    </div>` : '';

  const linhaAcrescimo = calc.acrescimo > 0 ? `
    <div class="checkout-form__summary-row co-summary-acrescimo">
      <span>💳 Acréscimo (crédito +3%)</span>
      <span>+ ${Cart.formatCurrency(calc.acrescimo)}</span>
    </div>` : '';

  container.innerHTML = `
    <p class="checkout-form__summary-title">Resumo do pedido</p>
    ${linhasItens}
    ${linhaEntrega}
    ${linhaDesconto}
    ${linhaAcrescimo}
    <div class="checkout-form__summary-row checkout-form__summary-row--total">
      <strong>Total</strong>
      <strong id="co-total-valor">${Cart.formatCurrency(calc.total)}</strong>
    </div>
  `;
}

/* ── Submit ───────────────────────────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();
  const form  = e.target;
  const errEl = document.getElementById('checkout-error');
  const btn   = document.getElementById('btn-confirmar-pedido');
  errEl.hidden = true;

  const nome = form.nome_cliente.value.trim();
  if (!nome) { mostrarErro('Por favor, informe seu nome.'); return; }

  const tipo    = form.tipo.value;
  const tipoObj = TIPOS_PEDIDO.find(t => t.id === tipo);

  // Valida bairro se delivery
  if (tipoObj?.requerEndereco) {
    const bairro = document.getElementById('co-bairro').value;
    if (!bairro) { mostrarErro('Selecione o bairro de entrega.'); return; }
  }

  // Monta endereço completo
  let enderecoCompleto = null;
  if (tipoObj?.requerEndereco) {
    const bairro      = document.getElementById('co-bairro').value;
    const rua         = document.getElementById('co-rua').value.trim();
    const numero      = document.getElementById('co-numero').value.trim();
    const complemento = document.getElementById('co-complemento').value.trim();
    const referencia  = document.getElementById('co-referencia').value.trim();

    const partes = [rua, numero, complemento, bairro, referencia].filter(Boolean);
    enderecoCompleto = partes.join(', ');
  }

  // Calcula totais finais
  const subtotal = Cart.getSubtotal();
  const calc     = CheckoutCalculator.calcular({
    subtotal,
    taxaEntrega: _taxaEntrega,
    cupom:       _cupomAtual,
    pagamentoId: _pagamentoId,
  });

  btn.disabled    = true;
  btn.textContent = 'Enviando...';

  try {
    const cartItems = Cart.getItems();
    const itens = cartItems.map(i => ({
      produto_id: extrairIdNumerico(i.id),
      quantidade: i.quantity,
    }));

    // Tipo mapeado: 'local' vira 'balcao' na API (sem quebrar rota existente)
    const tipoAPI = tipo === 'local' ? 'balcao' : tipo;

    // Observação limpa (sem dados financeiros — agora nos campos estruturados)
    const obsTexto = [
      form.observacao.value.trim(),
      tipo === 'local' ? '[COMER NO LOCAL]' : '',
    ].filter(Boolean).join(' ');

    const payload = {
      tipo:                tipoAPI,
      nome_cliente:        nome,
      telefone:            form.telefone.value.trim() || null,
      endereco:            enderecoCompleto,
      observacao:          obsTexto || null,
      itens,
      // Campos financeiros estruturados (salvos permanentemente no banco)
      coupon_code:         _cupomAtual ? _cupomAtual.codigo : null,
      discount_type:       _cupomAtual ? _cupomAtual.type   : null,
      discount_percentage: _cupomAtual && _cupomAtual.type === 'percent'
                             ? _cupomAtual.value : null,
      discount_amount:     calc.desconto    > 0 ? calc.desconto    : 0,
      delivery_fee:        calc.taxaEntrega > 0 ? calc.taxaEntrega : 0,
      credit_surcharge:    calc.acrescimo   > 0 ? calc.acrescimo   : 0,
      payment_method:      tipoObj?.requerEndereco
                             ? PagamentoService.getLabel(_pagamentoId) : null,
    };

    const pedido = await API.criarPedido(payload);

    // Salva WhatsApp no localStorage para "Meus Pedidos"
    const telValue = form.telefone.value.trim();
    if (telValue) {
      localStorage.setItem('cliente_whatsapp', telValue);
    }

    Cart.clear();
    fecharModal();
    Cart.showToast('Pedido enviado com sucesso! 🧉');
    setTimeout(() => {
      window.location.href = `pedidos.html?novo=${pedido.id}`;
    }, 1200);
  } catch (err) {
    mostrarErro(err.message);
    btn.disabled    = false;
    btn.textContent = 'Confirmar Pedido';
  }
}

/* ── Helpers ─────────────────────────────────────────────── */
function extrairIdNumerico(id) {
  const n = parseInt(id);
  if (!isNaN(n)) return n;
  throw new Error(`Produto "${id}" precisa ser cadastrado pelo painel admin.`);
}

function mostrarErro(msg) {
  const el = document.getElementById('checkout-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function abrirModalCheckout() {
  if (Cart.getItems().length === 0) {
    Cart.showToast('Adicione itens antes de finalizar! 🛒');
    return;
  }
  const existing = document.getElementById('checkout-overlay');
  if (existing) existing.remove();
  criarModal();
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('checkout-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
  }, 300);
}

/* ── Estilos do modal (injetados dinamicamente) ─────────── */
const style = document.createElement('style');
style.textContent = `
  /* ── Overlay & Modal ── */
  #checkout-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.55);
    z-index: 1000;
    display: flex; align-items: flex-end;
    opacity: 0; transition: opacity .3s ease;
    backdrop-filter: blur(4px);
  }
  #checkout-overlay.active { opacity: 1; }
  .checkout-modal {
    background: var(--color-surface, #fff);
    border-radius: 20px 20px 0 0;
    padding: 24px 20px 40px;
    width: 100%; max-height: 92vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform .3s ease;
  }
  #checkout-overlay.active .checkout-modal { transform: translateY(0); }
  .checkout-modal__header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 20px;
  }
  .checkout-modal__title { font-size: 1.125rem; font-weight: 700; }
  .checkout-modal__close {
    background: none; border: none;
    font-size: 1.25rem; cursor: pointer;
    color: var(--color-gray-600);
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .checkout-modal__close:hover { background: var(--color-gray-100); }

  /* ── Form fields ── */
  .checkout-form__group { margin-bottom: 12px; }
  .checkout-form__label {
    display: block; font-size: .78rem;
    font-weight: 600; color: var(--color-gray-700);
    margin-bottom: 5px;
  }
  .checkout-form__input,
  .checkout-form__select,
  .checkout-form__textarea {
    width: 100%; padding: 10px 12px;
    border: 1.5px solid var(--color-border, #e9ecef);
    border-radius: 8px; font-size: .875rem;
    font-family: inherit; background: var(--color-bg, #f8f9fa);
    transition: border-color .2s;
    box-sizing: border-box;
    color: inherit;
  }
  .checkout-form__input:focus,
  .checkout-form__select:focus,
  .checkout-form__textarea:focus {
    outline: none; border-color: var(--color-primary, #0B3D2E);
  }

  /* ── Bloco entrega ── */
  .co-bloco {
    background: var(--color-gray-50, #f8f9fa);
    border: 1px solid var(--color-border);
    border-radius: 12px; padding: 14px;
    margin-bottom: 14px;
  }
  .co-bloco__title {
    font-size: .8rem; font-weight: 700;
    color: var(--color-primary, #0B3D2E);
    margin-bottom: 12px; letter-spacing: .02em;
    text-transform: uppercase;
  }
  .co-grid2 {
    display: grid; grid-template-columns: 1fr 100px;
    gap: 10px; margin-bottom: 12px;
  }
  .co-grid2 .checkout-form__group { margin-bottom: 0; }

  /* ── Taxa info ── */
  .co-taxa-info {
    display: flex; align-items: center; gap: 8px;
    font-size: .8rem; padding: 8px 10px;
    border-radius: 8px;
    background: var(--color-gray-100, #f1f3f5);
    margin-top: 4px; margin-bottom: 4px;
    color: var(--color-gray-700);
    min-height: 34px;
  }
  .taxa-proxima { color: #1a7a4a; font-weight: 600; }
  .taxa-distante { color: #c0392b; font-weight: 600; }

  /* ── Pagamento ── */
  .co-payment {
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 8px;
  }
  .co-payment__option {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 8px;
    border: 1.5px solid var(--color-border);
    cursor: pointer; transition: all .2s;
    font-size: .875rem;
  }
  .co-payment__option input { margin: 0; accent-color: var(--color-primary, #0B3D2E); }
  .co-payment__option--selected {
    border-color: var(--color-primary, #0B3D2E);
    background: var(--color-primary-light, #E8F5F1);
  }

  /* ── Cupom ── */
  .co-cupom {
    background: var(--color-gray-50, #f8f9fa);
    border: 1px dashed var(--color-border);
    border-radius: 12px; padding: 12px;
    margin-bottom: 14px;
  }
  .co-cupom__title {
    font-size: .78rem; font-weight: 700;
    color: var(--color-gray-700); margin-bottom: 10px;
  }
  .co-cupom__row { display: flex; gap: 8px; }
  .co-cupom__input { flex: 1; margin-bottom: 0 !important; text-transform: uppercase; }
  .co-cupom__btn {
    padding: 10px 14px;
    background: var(--color-primary, #0B3D2E); color: #fff;
    border: none; border-radius: 8px;
    font-size: .825rem; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: opacity .2s;
  }
  .co-cupom__btn:hover { opacity: .85; }
  .co-cupom__msg { font-size: .78rem; margin-top: 6px; min-height: 16px; }
  .co-cupom__msg--ok   { color: #1a7a4a; }
  .co-cupom__msg--erro { color: var(--color-danger, #e74c3c); }

  /* ── Resumo ── */
  .checkout-form__summary {
    background: var(--color-gray-50, #f8f9fa);
    border-radius: 10px; padding: 12px; margin-bottom: 16px;
    border: 1px solid var(--color-border);
  }
  .checkout-form__summary-title {
    font-weight: 700; font-size: .85rem;
    color: var(--color-gray-700); margin-bottom: 10px;
  }
  .checkout-form__summary-row {
    display: flex; justify-content: space-between;
    font-size: .85rem; padding: 3px 0;
    color: var(--color-gray-700);
  }
  .checkout-form__summary-row--total {
    border-top: 1.5px solid var(--color-border);
    margin-top: 8px; padding-top: 10px;
    font-size: 1rem;
  }
  .co-summary-desconto { color: #1a7a4a; }
  .co-summary-acrescimo { color: #c0392b; }

  /* ── Error ── */
  .checkout-form__error {
    color: var(--color-danger, #e74c3c);
    font-size: .85rem; margin-top: 10px;
    text-align: center;
  }

  /* ── Desktop ── */
  @media (min-width: 600px) {
    .checkout-modal {
      max-width: 500px; margin: auto;
      border-radius: 20px; align-self: center;
    }
    #checkout-overlay { align-items: center; }
    .co-payment { flex-direction: row; flex-wrap: wrap; }
    .co-payment__option { flex: 1; min-width: 130px; }
  }
`;
document.head.appendChild(style);
