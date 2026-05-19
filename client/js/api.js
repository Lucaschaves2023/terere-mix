/* ============================================
   Tereré Mix — API Client
   Módulo central para comunicação com o backend
   ============================================ */

// URL relativa — funciona tanto em localhost:3000 quanto na Vercel
const API_BASE = '/api';

// Token de autenticação (preenchido pelo admin-auth.js após login)
let _authToken = null;

const api = {

  /* ── Gerenciamento de autenticação ──────── */

  setToken(token) { _authToken = token; },
  clearToken()    { _authToken = null;  },

  // Monta os headers HTTP com Content-Type e, se disponível, Bearer token
  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (_authToken) h['Authorization'] = `Bearer ${_authToken}`;
    return h;
  },

  /* ── Produtos ───────────────────────────── */

  // incluirInativos: true apenas para o painel admin
  async getProdutos(categoria, incluirInativos = false) {
    const params = new URLSearchParams();
    if (categoria)        params.set('categoria', categoria);
    if (incluirInativos)  params.set('incluirInativos', 'true');
    const query = params.toString();
    const url = query ? `${API_BASE}/produtos?${query}` : `${API_BASE}/produtos`;
    const res = await fetch(url, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getProduto(id) {
    const res = await fetch(`${API_BASE}/produtos/${id}`, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async criarProduto(payload) {
    const res = await fetch(`${API_BASE}/produtos`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async atualizarProduto(id, payload) {
    const res = await fetch(`${API_BASE}/produtos/${id}`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async desativarProduto(id) {
    const res = await fetch(`${API_BASE}/produtos/${id}`, {
      method: 'DELETE',
      headers: this._headers(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  },

  /* ── Pedidos ────────────────────────────── */

  async getPedidos(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_BASE}/pedidos?${params}` : `${API_BASE}/pedidos`;
    const res = await fetch(url, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getPedido(id) {
    const res = await fetch(`${API_BASE}/pedidos/${id}`, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async criarPedido(payload) {
    const res = await fetch(`${API_BASE}/pedidos`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async atualizarStatus(id, status) {
    const res = await fetch(`${API_BASE}/pedidos/${id}/status`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  /* ── Estoque ────────────────────────────── */

  async getEstoque() {
    const res = await fetch(`${API_BASE}/estoque`, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async registrarEntrada(produto_id, quantidade, motivo) {
    const res = await fetch(`${API_BASE}/estoque/entrada`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ produto_id, quantidade, motivo }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getMovimentacoes(produto_id) {
    const url = produto_id
      ? `${API_BASE}/estoque/movimentacoes?produto_id=${produto_id}`
      : `${API_BASE}/estoque/movimentacoes`;
    const res = await fetch(url, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  /* ── Cupons ─────────────────────────────── */

  async getCupons(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_BASE}/cupons?${params}` : `${API_BASE}/cupons`;
    const res = await fetch(url, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getCupom(id) {
    const res = await fetch(`${API_BASE}/cupons/${id}`, { headers: this._headers() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async validarCupom(code, subtotal = 0) {
    const res = await fetch(`${API_BASE}/cupons/validar`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ code, subtotal }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data; // { valido, cupom?, erro? }
  },

  async criarCupom(payload) {
    const res = await fetch(`${API_BASE}/cupons`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async atualizarCupom(id, payload) {
    const res = await fetch(`${API_BASE}/cupons/${id}`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async excluirCupom(id) {
    const res = await fetch(`${API_BASE}/cupons/${id}`, {
      method: 'DELETE',
      headers: this._headers(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  },
};

// Disponibiliza globalmente
window.API = api;
