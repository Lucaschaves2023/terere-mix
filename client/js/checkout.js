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
          <label for="co-telefone" class="checkout-form__label">WhatsApp *</label>
          <input type="tel" id="co-telefone" name="telefone"
                 class="checkout-form__input" placeholder="(92) 99999-9999" autocomplete="tel" required>
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
        </div>

        <!-- Forma de pagamento (sempre visível) -->
        <div class="co-bloco">
          <div class="co-bloco__title">💳 Forma de Pagamento *</div>
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

  const tel = form.telefone.value.trim();
  if (!tel) { mostrarErro('Por favor, informe seu WhatsApp para acompanhar o pedido.'); return; }

  const tipo    = form.tipo.value;
  const tipoObj = TIPOS_PEDIDO.find(t => t.id === tipo);

  // Valida bairro se delivery
  if (tipoObj?.requerEndereco) {
    const bairro = document.getElementById('co-bairro').value;
    if (!bairro) { mostrarErro('Selecione o bairro de entrega.'); return; }
  }

  // Monta endereço completo e captura bairro/numero separados
  let enderecoCompleto = null;
  let bairroSeparado   = null;
  let numeroSeparado   = null;
  if (tipoObj?.requerEndereco) {
    const bairro      = document.getElementById('co-bairro').value;
    const rua         = document.getElementById('co-rua').value.trim();
    const numero      = document.getElementById('co-numero').value.trim();
    const complemento = document.getElementById('co-complemento').value.trim();
    const referencia  = document.getElementById('co-referencia').value.trim();

    bairroSeparado   = bairro  || null;
    numeroSeparado   = numero  || null;

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
      bairro:              bairroSeparado,
      numero:              numeroSeparado,
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
      payment_method:      PagamentoService.getLabel(_pagamentoId),
    };

    const pedido = await API.criarPedido(payload);

    // Salva WhatsApp no localStorage para "Meus Pedidos"
    const telValue = form.telefone.value.trim();
    if (telValue) {
      localStorage.setItem('cliente_whatsapp', telValue);
    }

    Cart.clear();
    fecharModal();
    await mostrarConfirmacaoPedido(pedido);
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

/* ── Confirmação pós-pedido ──────────────────────────────── */

function _escConf(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _fmtBRLConf(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarMensagemWhatsApp(pedido) {
  const numLabel  = pedido.numped ? `#${pedido.numped}` : `#${pedido.id}`;
  const linkAcomp = `${window.location.origin}/pedidos.html?novo=${pedido.id}`;
  const itens     = Array.isArray(pedido.itens) ? pedido.itens : [];

  const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tipoMap = { online: 'Delivery', balcao: 'Retirada / Local' };
  const tipoLabel = tipoMap[pedido.tipo] || pedido.tipo || '-';

  const enderecoLinha = (pedido.tipo === 'online' && pedido.endereco)
    ? `Endereço: ${pedido.endereco}`
    : 'Endereço: Retirada na loja';

  const listaItens = itens
    .map(i => `➡️ ${i.quantidade}x ${i.nome_produto} — R$ ${fmt(parseFloat(i.preco_unit) * i.quantidade)}`)
    .join('\n');

  const subtotal = parseFloat(pedido.subtotal_amount || 0);
  const desconto = parseFloat(pedido.discount_amount || 0);
  const entrega  = parseFloat(pedido.delivery_fee    || 0);
  const total    = parseFloat(pedido.total           || 0);

  return [
    `Pedido Tereré Mix: ${numLabel}`,
    ``,
    `Estimativa: 15 - 35 minutos`,
    ``,
    `Acompanhe o pedido👇:`,
    linkAcomp,
    ``,
    `Tipo: ${tipoLabel}`,
    enderecoLinha,
    ``,
    `NOME: ${pedido.nome_cliente || '-'}`,
    `Fone: ${pedido.telefone || '-'}`,
    ``,
    `------------------------------`,
    listaItens,
    `------------------------------`,
    ``,
    `Itens: R$ ${fmt(subtotal)}`,
    `Desconto: R$ ${fmt(desconto)}`,
    `Entrega: R$ ${fmt(entrega)}`,
    ``,
    `TOTAL: R$ ${fmt(total)}`,
    `------------------------------`,
    ``,
    `Pagamento: ${pedido.payment_method || 'Não informado'}`,
  ].join('\n');
}

async function mostrarConfirmacaoPedido(pedido) {
  // Busca WhatsApp/Instagram da empresa (com fallback)
  let empresa = null;
  try { empresa = await API.getEmpresa(); } catch { /* usa fallback */ }

  const digitos    = (empresa?.whatsapp || '').replace(/\D/g, '');
  const wppEmpresa = digitos
    ? (digitos.startsWith('55') ? digitos : `55${digitos}`)
    : '559285236009';
  const instagram  = empresa?.instagram || null;

  const numLabel = pedido.numped ? `#${pedido.numped}` : `#${pedido.id}`;
  const itens    = Array.isArray(pedido.itens) ? pedido.itens : [];
  const hora     = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const tipoMap = { online: '🛵 Delivery', balcao: '🏪 Retirada / Local' };
  const tipoLabel = tipoMap[pedido.tipo] || pedido.tipo || '-';

  const subtotal = parseFloat(pedido.subtotal_amount || 0);
  const desconto = parseFloat(pedido.discount_amount || 0);
  const entrega  = parseFloat(pedido.delivery_fee    || 0);
  const total    = parseFloat(pedido.total           || 0);

  const linhasItens = itens.map(i => `
    <div class="conf-item">
      <span class="conf-item__qty">${i.quantidade}×</span>
      <span class="conf-item__name">${_escConf(i.nome_produto)}</span>
      <span class="conf-item__price">${_fmtBRLConf(parseFloat(i.preco_unit) * i.quantidade)}</span>
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'conf-overlay';
  overlay.innerHTML = `
    <div class="conf-modal" role="dialog" aria-modal="true" aria-label="Pedido confirmado">

      <div class="conf-header">
        <div class="conf-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 class="conf-title">Pedido Confirmado!</h2>
        <p class="conf-subtitle">Pedido ${_escConf(numLabel)} &bull; ${hora}</p>
      </div>

      <div class="conf-body">

        <div class="conf-info-row">
          <span class="conf-info-icon">📦</span>
          <div>
            <span class="conf-info-label">Tipo</span>
            <span class="conf-info-value" style="display:block;color:#111;font-weight:600;font-size:.875rem;">${tipoLabel}</span>
          </div>
        </div>
        ${pedido.endereco ? `
        <div class="conf-info-row">
          <span class="conf-info-icon">📍</span>
          <div>
            <span class="conf-info-label">Endereço</span>
            <span class="conf-info-value" style="display:block;color:#111;font-weight:600;font-size:.875rem;">${_escConf(pedido.endereco)}</span>
          </div>
        </div>` : ''}
        <div class="conf-info-row">
          <span class="conf-info-icon">⏱️</span>
          <div>
            <span class="conf-info-label">Estimativa</span>
            <span class="conf-info-value" style="display:block;color:#111;font-weight:600;font-size:.875rem;">15 – 35 minutos</span>
          </div>
        </div>
        ${pedido.payment_method ? `
        <div class="conf-info-row">
          <span class="conf-info-icon">💳</span>
          <div>
            <span class="conf-info-label">Pagamento</span>
            <span class="conf-info-value" style="display:block;color:#111;font-weight:600;font-size:.875rem;">${_escConf(pedido.payment_method)}</span>
          </div>
        </div>` : ''}

        <div class="conf-itens-wrap">${linhasItens}</div>

        <div class="conf-totais">
          <div class="conf-total-row"><span>Subtotal</span><span>${_fmtBRLConf(subtotal)}</span></div>
          ${desconto > 0 ? `<div class="conf-total-row conf-desconto"><span>Desconto</span><span>− ${_fmtBRLConf(desconto)}</span></div>` : ''}
          ${entrega  > 0 ? `<div class="conf-total-row"><span>Entrega</span><span>${_fmtBRLConf(entrega)}</span></div>` : ''}
          <div class="conf-total-row conf-total-final">
            <strong>Total</strong><strong>${_fmtBRLConf(total)}</strong>
          </div>
        </div>

        <div class="conf-btns">
          <a href="pedidos.html?novo=${pedido.id}" class="conf-btn conf-btn--outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Acompanhar Pedido
          </a>
          <button id="btn-conf-wpp" class="conf-btn conf-btn--wpp">
            <svg viewBox="0 0 32 32" fill="currentColor" width="18" height="18">
              <path d="M16 2C8.28 2 2 8.28 2 16c0 2.47.67 4.79 1.84 6.78L2 30l7.43-1.95A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.21 0-4.28-.65-6.02-1.76l-.43-.27-4.41 1.16 1.17-4.3-.28-.45A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.56c-.34-.17-2.02-1-2.34-1.11-.32-.11-.55-.17-.78.17-.23.34-.88 1.11-1.08 1.34-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.57-.28-.67-.57-.58-.78-.59h-.67c-.23 0-.6.09-.91.43-.31.34-1.19 1.16-1.19 2.83s1.22 3.28 1.39 3.51c.17.23 2.4 3.66 5.82 5.14.81.35 1.44.56 1.93.72.81.26 1.55.22 2.14.13.65-.1 2.02-.83 2.3-1.62.29-.8.29-1.48.2-1.62-.09-.14-.32-.23-.66-.4z"/>
            </svg>
            Enviar no WhatsApp
          </button>
          ${instagram ? `
          <a href="https://instagram.com/${_escConf(instagram.replace('@', ''))}"
             target="_blank" rel="noopener noreferrer" class="conf-btn conf-btn--ig">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Ver no Instagram
          </a>` : ''}
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btn-conf-wpp').addEventListener('click', () => {
    const msg = gerarMensagemWhatsApp(pedido);
    window.open(`https://wa.me/${wppEmpresa}?text=${encodeURIComponent(msg)}`, '_blank');
  });

  requestAnimationFrame(() => overlay.classList.add('active'));
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

  /* ── Desktop checkout ── */
  @media (min-width: 600px) {
    .checkout-modal {
      max-width: 500px; margin: auto;
      border-radius: 20px; align-self: center;
    }
    #checkout-overlay { align-items: center; }
    .co-payment { flex-direction: row; flex-wrap: wrap; }
    .co-payment__option { flex: 1; min-width: 130px; }
  }

  /* ══════════════════════════════════════
     Confirmação pós-pedido
  ══════════════════════════════════════ */
  #conf-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.6);
    z-index: 1100;
    display: flex; align-items: flex-end;
    opacity: 0; transition: opacity .3s ease;
    backdrop-filter: blur(4px);
  }
  #conf-overlay.active { opacity: 1; }

  .conf-modal {
    width: 100%; max-height: 94vh;
    overflow-y: auto;
    background: var(--color-surface, #1a1a1a);
    border-radius: 24px 24px 0 0;
    transform: translateY(100%);
    transition: transform .35s cubic-bezier(.32,1,.23,1);
  }
  #conf-overlay.active .conf-modal { transform: translateY(0); }

  /* Header verde */
  .conf-header {
    background: linear-gradient(135deg, #0B3D2E 0%, #1a7a4a 100%);
    padding: 28px 20px 24px;
    text-align: center;
    border-radius: 24px 24px 0 0;
  }
  .conf-check {
    width: 56px; height: 56px;
    background: rgba(255,255,255,.15);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
    color: #fff;
    animation: conf-pop .4s cubic-bezier(.34,1.56,.64,1) .1s both;
  }
  @keyframes conf-pop {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  .conf-title {
    font-size: 1.25rem; font-weight: 700;
    color: #fff; margin: 0 0 4px;
  }
  .conf-subtitle {
    font-size: .85rem; color: rgba(255,255,255,.75);
    margin: 0;
  }

  /* Body */
  .conf-body { padding: 20px 16px 36px; }

  /* Info rows */
  .conf-info-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,.08));
  }
  .conf-info-icon { font-size: 1.1rem; line-height: 1.4; flex-shrink: 0; }
  .conf-info-label {
    display: block !important;
    font-size: .72rem !important;
    color: #999 !important;
    margin: 0 0 2px !important;
    text-transform: uppercase;
    letter-spacing: .04em;
    font-weight: 500 !important;
  }
  .conf-info-value {
    display: block !important;
    font-size: .875rem !important;
    font-weight: 600 !important;
    color: #1a1a1a !important;
    margin: 0 !important;
  }

  /* Itens */
  .conf-itens-wrap {
    margin: 14px 0 0;
    border: 1px solid var(--color-border, rgba(255,255,255,.08));
    border-radius: 12px; overflow: hidden;
  }
  .conf-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,.06));
    font-size: .85rem;
  }
  .conf-item:last-child { border-bottom: none; }
  .conf-item__qty {
    font-weight: 700; color: var(--color-primary, #1a7a4a);
    min-width: 22px;
  }
  .conf-item__name { flex: 1; color: var(--color-text, #fff); }
  .conf-item__price { color: var(--color-gray-400, #aaa); font-size: .8rem; }

  /* Totais */
  .conf-totais {
    margin: 14px 0 20px;
    background: var(--color-gray-50, rgba(255,255,255,.04));
    border-radius: 12px; padding: 12px 14px;
    border: 1px solid var(--color-border, rgba(255,255,255,.08));
  }
  .conf-total-row {
    display: flex; justify-content: space-between;
    font-size: .85rem; padding: 3px 0;
    color: var(--color-gray-400, #aaa);
  }
  .conf-desconto { color: #1a7a4a; }
  .conf-total-final {
    border-top: 1.5px solid var(--color-border, rgba(255,255,255,.12));
    margin-top: 8px; padding-top: 10px;
    font-size: 1rem;
    color: var(--color-text, #fff);
  }

  /* Botões */
  .conf-btns {
    display: flex; flex-direction: column; gap: 10px;
  }
  .conf-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 16px; border-radius: 12px;
    font-size: .925rem; font-weight: 600;
    cursor: pointer; text-decoration: none;
    border: none; transition: opacity .2s, transform .1s;
  }
  .conf-btn:active { transform: scale(.98); }
  .conf-btn--wpp {
    background: #25D366; color: #fff;
    order: -1;
  }
  .conf-btn--wpp:hover { opacity: .92; }
  .conf-btn--outline {
    background: transparent;
    border: 1.5px solid var(--color-border, rgba(255,255,255,.2));
    color: var(--color-text, #fff);
  }
  .conf-btn--outline:hover { background: rgba(255,255,255,.05); }
  .conf-btn--ig {
    background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    color: #fff;
  }
  .conf-btn--ig:hover { opacity: .92; }

  /* Desktop confirmação */
  @media (min-width: 600px) {
    #conf-overlay { align-items: center; }
    .conf-modal {
      max-width: 480px; border-radius: 24px;
      margin: auto; transform: translateY(40px) scale(.97);
    }
    #conf-overlay.active .conf-modal { transform: translateY(0) scale(1); }
    .conf-header { border-radius: 24px 24px 0 0; }
    .conf-btns { flex-direction: row; flex-wrap: wrap; }
    .conf-btn--wpp { flex: 1 1 100%; order: -1; }
    .conf-btn--outline, .conf-btn--ig { flex: 1; }
  }
`;
document.head.appendChild(style);
