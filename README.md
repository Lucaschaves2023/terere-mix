# 🧉 Tereré Mix

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sql.js.org/)
[![HTML5](https://img.shields.io/badge/HTML5-Frontend-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/Licen%C3%A7a-MIT-green?style=for-the-badge)](LICENSE)

> **Sistema de e-commerce completo para a lanchonete Tereré Mix**, com cardápio digital, carrinho de compras, gestão de pedidos em tempo real e painel administrativo integrado.

---

## 📋 Índice

- [Descrição](#-descrição)
- [Objetivo](#-objetivo)
- [Funcionalidades](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias-utilizadas)
- [Arquitetura](#-arquitetura-do-sistema)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Requisitos](#-requisitos-para-execução)
- [Instalação Rápida](#-instalação-rápida)
- [Como Executar](#-como-executar-localmente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [API Reference](#-api-reference)
- [Banco de Dados](#-banco-de-dados)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Melhorias Futuras](#-melhorias-futuras)
- [Autor](#-autor)
- [Licença](#-licença)

---

## 📖 Descrição

O **Tereré Mix** é um sistema web de e-commerce desenvolvido para lanchonetes e pequenos comércios. Ele oferece uma experiência completa de compra online — do cardápio ao checkout — integrada a um robusto painel administrativo para gerenciamento de produtos, pedidos e estoque.

O sistema adota uma arquitetura **cliente-servidor**, com um backend RESTful em **Node.js/Express** e um frontend puramente em **HTML, CSS e JavaScript Vanilla**, conectados via API JSON. O banco de dados utilizado é o **SQLite**, gerenciado pela biblioteca `sql.js` para máxima portabilidade.

---

## 🎯 Objetivo

Fornecer uma solução simples, leve e de fácil implantação para que estabelecimentos como o Tereré Mix possam:

- Digitalizar seu cardápio e receber pedidos online;
- Gerenciar o fluxo de pedidos (pendente → preparando → pronto → entregue);
- Controlar o estoque de produtos com registro de movimentações;
- Acompanhar tudo em tempo real por meio de um painel administrativo.

---

## ✨ Funcionalidades Principais

### 🛒 Área do Cliente
| Funcionalidade | Descrição |
|---|---|
| Cardápio Digital | Listagem de produtos por categoria com imagens e preços |
| Carrinho de Compras | Adição/remoção de itens com cálculo automático de total |
| Checkout | Formulário de finalização com dados de entrega |
| Acompanhamento de Pedidos | Consulta de status em tempo real por número do pedido |

### 🔧 Painel Administrativo (`/admin.html`)
| Funcionalidade | Descrição |
|---|---|
| Gestão de Produtos | Cadastro, edição e desativação de produtos |
| Gestão de Pedidos | Visualização e atualização de status dos pedidos |
| Controle de Estoque | Entradas manuais e histórico de movimentações |
| Dashboard | Visão geral dos pedidos e métricas do negócio |

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.x | Runtime JavaScript no servidor |
| [Express](https://expressjs.com/) | ^5.2.1 | Framework HTTP/RESTful API |
| [sql.js](https://sql.js.org/) | ^1.14.1 | SQLite compilado para Node.js via WebAssembly |
| [cors](https://www.npmjs.com/package/cors) | ^2.8.6 | Política de Cross-Origin Resource Sharing |
| [nodemon](https://nodemon.io/) | ^3.1.14 | Hot-reload em desenvolvimento |

### Frontend
| Tecnologia | Função |
|---|---|
| HTML5 | Estrutura semântica das páginas |
| CSS3 Vanilla | Estilização com variáveis, reset e componentes modulares |
| JavaScript ES2022 | Lógica do cliente (SPA-like com módulos JS) |
| Fetch API | Comunicação assíncrona com a API REST |

### Banco de Dados
| Tecnologia | Função |
|---|---|
| SQLite | Armazenamento relacional persistente em arquivo |
| sql.js | Driver SQLite para ambientes Node/Browser |
| WAL Mode | Write-Ahead Logging para melhor concorrência |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    NAVEGADOR (Cliente)                │
│                                                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ index.html │  │ cardapio.html│  │  admin.html  │  │
│  │ carrinho   │  │ pedidos.html │  │  (painel)    │  │
│  └─────┬──────┘  └──────┬───────┘  └──────┬───────┘  │
│        │                │                  │          │
│        └────────────────┼──────────────────┘          │
│                         │  Fetch API (JSON)            │
└─────────────────────────┼────────────────────────────┘
                          │ HTTP :3000
┌─────────────────────────▼────────────────────────────┐
│                  SERVIDOR (Node.js/Express)            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   server.js                      │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │produtoRoutes│  │pedidoRoutes│  │estoqueRts │  │  │
│  │  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘  │  │
│  │         │               │                │        │  │
│  │  ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼─────┐  │  │
│  │  │produtoCtrl  │  │pedidoCtrl  │  │estoqueCtrl│  │  │
│  │  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘  │  │
│  └─────────┼───────────────┼────────────────┼────────┘  │
│            └───────────────┼────────────────┘           │
│                            │                            │
│                     ┌──────▼──────┐                     │
│                     │   db.js     │ (sql.js adapter)    │
│                     └──────┬──────┘                     │
└────────────────────────────┼───────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  terere.db      │
                    │ (SQLite / WAL)  │
                    └─────────────────┘
```

---

## 📁 Estrutura de Pastas

```
SIte terere mix fotos/
│
├── 📁 client/                    # Frontend (servido como estático)
│   ├── 📄 index.html             # Página inicial / entrada da loja
│   ├── 📄 cardapio.html          # Cardápio de produtos por categoria
│   ├── 📄 carrinho.html          # Carrinho de compras
│   ├── 📄 pedidos.html           # Acompanhamento de pedidos
│   ├── 📄 detalhes-pedido.html   # Detalhes de um pedido específico
│   ├── 📄 perfil-loja.html       # Perfil e informações da loja
│   ├── 📄 admin.html             # Painel administrativo completo
│   │
│   ├── 📁 css/
│   │   ├── reset.css             # Reset CSS base
│   │   ├── variables.css         # Design tokens (cores, fontes, espaçamento)
│   │   ├── components.css        # Componentes reutilizáveis
│   │   └── styles.css            # Estilos globais
│   │
│   ├── 📁 js/
│   │   ├── api.js                # Cliente HTTP — módulo central da API
│   │   ├── app.js                # Lógica do cardápio e página inicial
│   │   ├── cart.js               # Gerenciamento do carrinho (localStorage)
│   │   ├── checkout.js           # Fluxo de finalização de pedido
│   │   └── pedidos.js            # Consulta e rastreamento de pedidos
│   │
│   └── 📁 assets/                # Imagens, ícones e recursos estáticos
│
├── 📁 server/                    # Backend Node.js
│   ├── 📄 server.js              # Ponto de entrada — inicialização assíncrona
│   │e2
│   ├── 📁 routes/
│   │   ├── produtoRoutes.js      # CRUD de produtos (GET/POST/PUT/DELETE)
│   │   ├── pedidoRoutes.js       # Pedidos (GET/POST/PATCH status)
│   │   └── estoqueRoutes.js      # Estoque (GET/POST entrada/movimentações)
│   │
│   ├── 📁 controllers/
│   │   ├── produtoController.js  # Lógica de negócio — produtos
│   │   ├── pedidoController.js   # Lógica de negócio — pedidos + transações
│   │   └── estoqueController.js  # Lógica de negócio — estoque
│   │
│   ├── 📁 models/
│   │   └── db.js                 # Adaptador sql.js — interface com SQLite
│   │
│   └── 📁 config/                # Configurações do servidor
│
├── 📁 database/
│   ├── schema.sql                # DDL — criação das tabelas e índices
│   ├── seed.sql                  # Dados iniciais (produtos de exemplo)
│   └── terere.db                 # Arquivo do banco de dados SQLite
│
├── 📁 docs/                      # Documentação do projeto
├── 📄 package.json               # Dependências e scripts npm
├── 📄 package-lock.json          # Lock file (versionamento exato)
└── 📄 .gitignore                 # Arquivos ignorados pelo Git
```

---

## ✅ Requisitos para Execução

- **Node.js** `>= 18.0.0` — [Download](https://nodejs.org/)
- **npm** `>= 9.0.0` (incluso com o Node.js)
- Sistema operacional: Windows, macOS ou Linux

> Verifique sua versão com:
> ```bash
> node -v
> npm -v
> ```

---

## ⚡ Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/terere-mix.git

# 2. Acesse a pasta do projeto
cd terere-mix

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Pronto! Acesse **http://localhost:3000** no navegador. 🎉

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar em modo desenvolvimento (com hot-reload)

```bash
npm run dev
```

### 3. Iniciar em modo produção

```bash
npm start
```

### 4. Acessar o sistema

| Página | URL |
|---|---|
| 🏠 Início / Loja | http://localhost:3000/index.html |
| 🍽️ Cardápio | http://localhost:3000/cardapio.html |
| 🛒 Carrinho | http://localhost:3000/carrinho.html |
| 📦 Pedidos | http://localhost:3000/pedidos.html |
| ⚙️ Admin | http://localhost:3000/admin.html |
| 🩺 API Health | http://localhost:3000/api/health |

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor com `node` (produção) |
| `npm run dev` | Inicia com `nodemon` — reinicia ao salvar arquivos |

---

## 🔌 API Reference

### Base URL
```
http://localhost:3000/api
```

### 📦 Produtos — `/api/produtos`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/produtos` | Lista todos os produtos ativos |
| `GET` | `/api/produtos?categoria=X` | Filtra por categoria |
| `GET` | `/api/produtos/:id` | Busca produto por ID |
| `POST` | `/api/produtos` | Cria novo produto |
| `PUT` | `/api/produtos/:id` | Atualiza produto existente |
| `DELETE` | `/api/produtos/:id` | Desativa produto (soft delete) |

### 🧾 Pedidos — `/api/pedidos`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/pedidos` | Lista pedidos (com filtros opcionais) |
| `GET` | `/api/pedidos?status=pendente` | Filtra por status |
| `GET` | `/api/pedidos/:id` | Busca pedido com itens |
| `POST` | `/api/pedidos` | Cria novo pedido (com baixa de estoque) |
| `PATCH` | `/api/pedidos/:id/status` | Atualiza status do pedido |

**Status válidos:** `pendente` → `preparando` → `pronto` → `entregue` / `cancelado`

> ⚠️ Ao cancelar um pedido, o estoque é automaticamente devolvido.

### 📊 Estoque — `/api/estoque`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/estoque` | Lista produtos com saldo de estoque |
| `POST` | `/api/estoque/entrada` | Registra entrada manual no estoque |
| `GET` | `/api/estoque/movimentacoes` | Histórico de movimentações |

### 🩺 Health Check

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica se o servidor está online |

---

## 🗄️ Banco de Dados

O banco de dados SQLite é composto por **4 tabelas principais**:

```sql
-- Produtos cadastrados na loja
CREATE TABLE produtos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT    NOT NULL,
  descricao  TEXT,
  preco      REAL    NOT NULL,
  categoria  TEXT    NOT NULL DEFAULT 'Geral',
  imagem     TEXT,
  estoque    INTEGER NOT NULL DEFAULT 0,
  ativo      INTEGER NOT NULL DEFAULT 1,  -- soft delete
  criado_em  TEXT
);

-- Pedidos realizados (online ou balcão)
CREATE TABLE pedidos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo          TEXT NOT NULL,   -- 'online' | 'balcao'
  status        TEXT NOT NULL,   -- 'pendente'|'preparando'|'pronto'|'entregue'|'cancelado'
  nome_cliente  TEXT,
  telefone      TEXT,
  endereco      TEXT,
  total         REAL NOT NULL,
  observacao    TEXT,
  criado_em     TEXT,
  atualizado_em TEXT
);

-- Itens de cada pedido
CREATE TABLE itens_pedido (
  pedido_id    INTEGER NOT NULL,
  produto_id   INTEGER NOT NULL,
  nome_produto TEXT NOT NULL,
  preco_unit   REAL NOT NULL,
  quantidade   INTEGER NOT NULL
);

-- Histórico de movimentações de estoque
CREATE TABLE estoque_movimentacao (
  produto_id INTEGER NOT NULL,
  tipo       TEXT NOT NULL,  -- 'entrada' | 'saida'
  quantidade INTEGER NOT NULL,
  motivo     TEXT,
  criado_em  TEXT
);
```

> 📌 O banco é inicializado automaticamente na primeira execução. Para popular com dados de exemplo, os arquivos `database/schema.sql` e `database/seed.sql` estão disponíveis.

---

## 🌍 Variáveis de Ambiente

Crie um arquivo **`.env`** na raiz do projeto com as seguintes variáveis:

```env
# Porta do servidor HTTP (padrão: 3000)
PORT=3000
```

> 🔒 O arquivo `.env` está listado no `.gitignore` e **não deve ser versionado**.

---

## 💡 Exemplos de Uso

### Criar um pedido via API

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "online",
    "nome_cliente": "João Silva",
    "telefone": "11999998888",
    "endereco": "Rua das Flores, 123",
    "itens": [
      { "produto_id": 1, "quantidade": 2 },
      { "produto_id": 3, "quantidade": 1 }
    ]
  }'
```

### Atualizar status de um pedido

```bash
curl -X PATCH http://localhost:3000/api/pedidos/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "preparando" }'
```

### Registrar entrada de estoque

```bash
curl -X POST http://localhost:3000/api/estoque/entrada \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": 1,
    "quantidade": 50,
    "motivo": "Reposição semanal"
  }'
```

### Listar pedidos pendentes

```bash
curl http://localhost:3000/api/pedidos?status=pendente
```

---

## 🔮 Melhorias Futuras

- [ ] 🔐 **Autenticação** — Sistema de login para o painel administrativo (JWT/sessão)
- [ ] 📱 **PWA** — Transformar o frontend em Progressive Web App para instalação mobile
- [ ] 🔔 **Notificações em Tempo Real** — WebSocket ou SSE para atualização automática de pedidos no admin
- [ ] 💳 **Integração de Pagamento** — Suporte ao Pix via API do Mercado Pago ou Stripe
- [ ] 📊 **Relatórios** — Dashboard com gráficos de vendas, produtos mais pedidos e faturamento
- [ ] 🐳 **Docker** — Containerização para facilitar implantação em produção
- [ ] 🌐 **Deploy em Nuvem** — Configuração para Railway, Render ou VPS
- [ ] 🧪 **Testes Automatizados** — Cobertura com Jest para controllers e rotas
- [ ] 📸 **Upload de Imagens** — Integração com Cloudinary ou S3 para fotos dos produtos
- [ ] 🗃️ **Migração para PostgreSQL** — Para ambientes de produção com maior volume de dados

---

## 👤 Autor

Desenvolvido com ☕ e 🧉 por **T14s**

- 📧 Entre em contato via [GitHub Issues](https://github.com/seu-usuario/terere-mix/issues)

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License — você pode usar, copiar, modificar e distribuir este software
livremente, desde que mantenha os créditos originais.
```

---

<div align="center">

**🧉 Feito com dedicação para o Tereré Mix**

*Um projeto simples que entrega uma experiência completa.*

</div>
