/* ============================================================
   Tereré Mix — services.js
   Módulo central de regras de negócio do checkout:
   • Entrega por bairro
   • Cálculo de taxa
   • Cupons de desconto
   • Acréscimo de forma de pagamento
   ============================================================ */

/* ── Configuração de Bairros e Taxas ──────────────────────────
   Estrutura preparada para novas zonas e valores customizados.
   Para adicionar bairro: inserir na lista da zona correspondente.
   Para criar nova zona: adicionar nova entrada em ZONAS_ENTREGA.
   ─────────────────────────────────────────────────────────── */
const ENTREGA_CONFIG = {

  /* Bairros próximos da loja (R. Maria Andrade, 245 – São Lázaro) */
  PROXIMOS: {
    taxa: 10.00,
    label: 'R$ 10,00',
    bairros: [
      // Zona Sul
      'são lázaro', 'crespo', 'japiim', 'raiz', 'petrópolis',
      'educandos', 'santa luzia', 'morro da liberdade',
      'cachoeirinha', 'betânia', 'colônia oliveira machado',
      'distrito industrial i', 'são francisco',
      // Zona Leste próxima
      'coroado',
    ],
  },

  /* Todos os demais bairros */
  DISTANTES: {
    taxa: 20.00,
    label: 'R$ 20,00',
  },
};

/* ── Configuração de Cupons ───────────────────────────────────
   type: 'percent' | 'fixed'
   value: porcentagem (0–100) ou valor fixo em R$
   ─────────────────────────────────────────────────────────── */
const CUPONS = {
  'TERERE10':  { type: 'percent', value: 10,  label: '10% de desconto' },
  'TERERE5':   { type: 'fixed',   value: 5,   label: 'R$ 5,00 de desconto' },
  'BOAS-VINDAS': { type: 'percent', value: 15, label: '15% de desconto' },
};

/* ── Configuração de Formas de Pagamento ──────────────────────
   acrescimo: porcentagem adicional sobre o total (0 = sem acréscimo)
   ─────────────────────────────────────────────────────────── */
const PAGAMENTOS = [
  { id: 'pix',      label: '🟣 PIX',              acrescimo: 0    },
  { id: 'debito',   label: '💳 Cartão de Débito', acrescimo: 0    },
  { id: 'credito',  label: '💳 Cartão de Crédito (+3%)', acrescimo: 3 },
];

/* ── Tipos de Pedido ──────────────────────────────────────────*/
const TIPOS_PEDIDO = [
  { id: 'online',   label: '🛵 Delivery',        requerEndereco: true,  requerPagamento: true  },
  { id: 'balcao',   label: '🏪 Retirada',         requerEndereco: false, requerPagamento: false },
  { id: 'local',    label: '🪑 Comer no Local',   requerEndereco: false, requerPagamento: false },
];

/* ═══════════════════════════════════════════════════════════
   DeliveryService — Cálculo de taxa por bairro
   ═══════════════════════════════════════════════════════════ */
const DeliveryService = {

  /**
   * Retorna a taxa de entrega para um bairro.
   * @param {string} bairro — Nome do bairro (case-insensitive)
   * @returns {{ taxa: number, label: string, zona: string }}
   */
  calcularTaxa(bairro) {
    if (!bairro || !bairro.trim()) {
      return { taxa: 0, label: 'Selecione o bairro', zona: '' };
    }
    const normalizado = bairro.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos para comparação

    const isProximo = ENTREGA_CONFIG.PROXIMOS.bairros.some(b => {
      const bn = b.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return bn === normalizado;
    });

    if (isProximo) {
      return {
        taxa:  ENTREGA_CONFIG.PROXIMOS.taxa,
        label: `Taxa de entrega: ${ENTREGA_CONFIG.PROXIMOS.label} (bairro próximo)`,
        zona:  'proxima',
      };
    }
    return {
      taxa:  ENTREGA_CONFIG.DISTANTES.taxa,
      label: `Taxa de entrega: ${ENTREGA_CONFIG.DISTANTES.label} (bairro distante)`,
      zona:  'distante',
    };
  },

  /** Lista de bairros próximos para autocomplete */
  getBairrosProximos() {
    return [...ENTREGA_CONFIG.PROXIMOS.bairros];
  },

  /** Todos os bairros de Manaus disponíveis no seletor */
  getTodosBairros() {
    return [
      // Zona Sul
      'São Lázaro', 'Crespo', 'Japiim', 'Raiz', 'Petrópolis',
      'Educandos', 'Santa Luzia', 'Morro da Liberdade',
      'Cachoeirinha', 'Betânia', 'Colônia Oliveira Machado',
      'Distrito Industrial I', 'São Francisco',
      // Zona Leste
      'Coroado', 'Tancredo Neves', 'Jorge Teixeira', 'Gilberto Mestrinho',
      'São José Operário', 'Armando Mendes', 'Zumbi dos Palmares',
      // Zona Norte
      'Novo Israel', 'Santa Etelvina', 'Cidade Nova', 'Nova Cidade',
      'Monte das Oliveiras', 'Colônia Terra Nova', 'Lago Azul',
      'Tarumã', 'Tarumã-Açu',
      // Zona Oeste / Centro
      'Centro', 'Praça 14 de Janeiro', 'Presidente Vargas',
      'São Raimundo', 'Compensa', 'Ponta Negra', 'Planalto',
      'Alvorada', 'Redenção', 'Santo Agostinho', 'Aparecida',
      // Outros
      'Flores', 'Chapada', 'Parque 10 de Novembro', 'Adrianópolis',
      'Nossa Senhora das Graças', 'Dom Pedro', 'Aleixo', 'Vieiralves',
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },
};

/* ═══════════════════════════════════════════════════════════
   CupomService — Validação e aplicação de cupons
   ═══════════════════════════════════════════════════════════ */
const CupomService = {

  /**
   * Valida cupom via API (async) — valida contra banco de dados real.
   * @param {string} codigo
   * @param {number} subtotal — subtotal atual do carrinho
   * @returns {Promise<{ valido: boolean, cupom?: object, erro?: string }>}
   */
  async validarOnline(codigo, subtotal = 0) {
    if (!codigo || !codigo.trim()) {
      return { valido: false, erro: 'Informe um cupom.' };
    }
    try {
      return await API.validarCupom(codigo.trim(), subtotal);
    } catch {
      return { valido: false, erro: 'Erro ao validar cupom. Tente novamente.' };
    }
  },

  /**
   * Valida cupom localmente (legado, mantido para compatibilidade).
   * @param {string} codigo
   * @returns {{ valido: boolean, cupom?: object, erro?: string }}
   */
  validar(codigo) {
    if (!codigo || !codigo.trim()) {
      return { valido: false, erro: 'Informe um cupom.' };
    }
    const cupom = CUPONS[codigo.trim().toUpperCase()];
    if (!cupom) {
      return { valido: false, erro: 'Cupom inválido ou expirado.' };
    }
    return { valido: true, cupom: { codigo: codigo.trim().toUpperCase(), ...cupom } };
  },

  /**
   * Calcula o valor do desconto.
   * @param {object} cupom
   * @param {number} subtotal
   * @returns {number}
   */
  calcularDesconto(cupom, subtotal) {
    if (!cupom) return 0;
    if (cupom.type === 'percent') return subtotal * (cupom.value / 100);
    if (cupom.type === 'fixed')   return Math.min(cupom.value, subtotal);
    return 0;
  },
};

/* ═══════════════════════════════════════════════════════════
   PagamentoService — Acréscimo por forma de pagamento
   ═══════════════════════════════════════════════════════════ */
const PagamentoService = {

  getOpcoes() {
    return PAGAMENTOS;
  },

  /**
   * Calcula acréscimo da forma de pagamento.
   * @param {string} pagamentoId
   * @param {number} total — Total após desconto + entrega
   * @returns {number}
   */
  calcularAcrescimo(pagamentoId, total) {
    const p = PAGAMENTOS.find(x => x.id === pagamentoId);
    if (!p || p.acrescimo === 0) return 0;
    return total * (p.acrescimo / 100);
  },

  getLabel(pagamentoId) {
    const p = PAGAMENTOS.find(x => x.id === pagamentoId);
    return p ? p.label : '';
  },
};

/* ═══════════════════════════════════════════════════════════
   CheckoutCalculator — Cálculo consolidado do pedido
   ═══════════════════════════════════════════════════════════ */
const CheckoutCalculator = {

  /**
   * Calcula o resumo financeiro completo.
   * @param {object} params
   * @param {number} params.subtotal
   * @param {number} params.taxaEntrega
   * @param {object|null} params.cupom
   * @param {string} params.pagamentoId
   * @returns {{ subtotal, desconto, taxaEntrega, acrescimo, total }}
   */
  calcular({ subtotal, taxaEntrega = 0, cupom = null, pagamentoId = '' }) {
    const desconto    = CupomService.calcularDesconto(cupom, subtotal);
    const aposDesconto = subtotal - desconto + taxaEntrega;
    const acrescimo   = PagamentoService.calcularAcrescimo(pagamentoId, aposDesconto);
    const total       = aposDesconto + acrescimo;

    return { subtotal, desconto, taxaEntrega, acrescimo, total };
  },
};

/* ── Exporta globalmente ──────────────────────────────────── */
window.TIPOS_PEDIDO       = TIPOS_PEDIDO;
window.DeliveryService    = DeliveryService;
window.CupomService       = CupomService;
window.PagamentoService   = PagamentoService;
window.CheckoutCalculator = CheckoutCalculator;
