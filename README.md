# 🧉 Tereré Mix

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![HTML5](https://img.shields.io/badge/HTML5-Frontend-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/Licen%C3%A7a-MIT-green?style=for-the-badge)](LICENSE)

> **Sistema de e-commerce completo para a lanchonete Tereré Mix**, com cardápio digital, carrinho de compras, gestão de pedidos em tempo real e painel administrativo integrado.

🌐 **Produção:** [terere-mix-2026.vercel.app](https://terere-mix-2026.vercel.app)

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
- [Deploy](#-deploy)
- [Páginas do Sistema](#-páginas-do-sistema)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Melhorias Futuras](#-melhorias-futuras)
- [Autor](#-autor)
- [Licença](#-licença)

---

## 📖 Descrição

O **Tereré Mix** é um sistema web de e-commerce desenvolvido para lanchonetes e pequenos comércios. Ele oferece uma experiência completa de compra online — do cardápio ao checkout — integrada a um robusto painel administrativo para gerenciamento de produtos, pedidos e estoque.

O sistema adota uma arquitetura **cliente-servidor**, com um backend RESTful em **Node.js/Express** e um frontend puramente em **HTML, CSS e JavaScript Vanilla**, conectados via API JSON. O banco de dados utilizado é o **PostgreSQL**, hospedado no **Supabase** (São Paulo), e o deploy é feito via **Vercel** como funções serverless.

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
| Checkout | Formulário de finalização com dados de entrega e cupom de desconto |
| Acompanhamento de Pedidos | Consulta de status em tempo real por número do pedido |
| Cupom de Desconto | Validação e aplicação de cupons percentuais ou de valor fixo |

### 🔧 Painel Administrativo (`/admin.html`)
| Funcionalidade | Descrição |
|---|---|
| Login Seguro | Autenticação via Supabase Auth (email + senha) |
| Gestão de Produtos | Cadastro, edição e desativação de produtos |
| Gestão de Pedidos | Visualização e atualização de status dos pedidos |
| Controle de Estoque | Entradas manuais e histórico de movimentações |
| Gestão de Cupons | Criação e gerenciamento de cupons de desconto |
| Dashboard | Visão geral dos pedidos e métricas do negócio |

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.x | Runtime JavaScript no servidor |
| [Express](https://expressjs.com/) | ^5.2.1 | Framework HTTP/RESTful API |
| [pg](https://node-postgres.com/) | latest | Driver PostgreSQL para Node.js |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | latest | Verificação de JWT do Supabase |
| [cors](https://www.npmjs.com/package/cors) | ^2.8.6 | Política de Cross-Origin Resource Sharing |
| [dotenv](https://github.com/motdotla/dotenv) | latest | Carregamento de variáveis de ambiente |
| [nodemon](https://nodemon.io/) | ^3.1.14 | Hot-reload em desenvolvimento |

### Frontend
| Tecnologia | Função |
|---|---|
| HTML5 | Estrutura semântica das páginas |
| CSS3 Vanilla | Estilização com variáveis, reset e componentes modulares |
| JavaScript ES2022 | Lógica do cliente (SPA-like com módulos JS) |
| Fetch API | Comunicação assíncrona com a API REST |
| Supabase JS (CDN) | Autenticação no painel admin |

### Banco de Dados e Infraestrutura
| Tecnologia | Função |
|---|---|
| PostgreSQL (Supabase) | Banco de dados relacional em nuvem — região São Paulo |
| Supabase Auth | Autenticação do painel administrativo |
| Vercel | Hospedagem serverless do frontend e API |

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
                          │ HTTPS
┌─────────────────────────▼────────────────────────────┐
│              VERCEL (Serverless Functions)             │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   api/index.js                   │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │produtoRoutes│  │pedidoRoutes│  │estoqueRts │  │  │
│  │  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘  │  │
│  │         │               │                │        │  │
│  │  ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼─────┐  │  │
│  │  │produtoCtrl  │  │pedidoCtrl  │  │estoqueCtrl│  │  │
│  │  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘  │  │
│  └─────────┼───────────────┼────────────────┼────────┘  │
└────────────┼───────────────┼────────────────┼───────────┘
             └───────────────┼────────────────┘
                             │ DATABASE_URL (pg)
┌────────────────────────────▼───────────────────────────┐
│              SUPABASE — South America (São Paulo)        │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐ │
│  │  PostgreSQL Database │   │     Supabase Auth        │ │
│  │  produtos            │   │  (login painel admin)    │ │
│  │  pedidos             │   └──────────────────────────┘ │
│  │  itens_pedido        │                                 │
│  │  estoque_movimentacao│                                 │
│  │  coupons             │                                 │
│  └─────────────────────┘                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
terere-mix/
│
├── 📁 api/
│   └── index.js                  # Entry point Vercel — re-exporta o app Express
│
├── 📁 client/                    # Frontend (servido como estático)
│   ├── 📄 index.html             # Página inicial / entrada da loja
│   ├── 📄 cardapio.html          # Cardápio de produtos por categoria
│   ├── 📄 carrinho.html          # Carrinho de compras
│   ├── 📄 pedidos.html           # Acompanhamento de pedidos
│   ├── 📄 detalhes-pedido.html   # Detalhes de um pedido específico
│   ├── 📄 perfil-loja.html       # Perfil e informações da loja
│   ├── 📄 admin-login.html       # Tela de login do painel admin
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
│   │   ├── admin-auth.js         # Guard de autenticação do painel admin
│   │   ├── app.js                # Lógica do cardápio e página inicial
│   │   ├── cart.js               # Gerenciamento do carrinho (localStorage)
│   │   ├── checkout.js           # Fluxo de finalização de pedido
│   │   ├── services.js           # Serviços (CupomService, etc.)
│   │   └── pedidos.js            # Consulta e rastreamento de pedidos
│   │
│   └── 📁 assets/                # Imagens, ícones e recursos estáticos
│
├── 📁 server/                    # Backend Node.js
│   ├── 📄 app.js                 # App Express sem listen (compatível com Vercel)
│   │
│   ├── 📁 routes/
│   │   ├── produtoRoutes.js      # CRUD de produtos (GET/POST/PUT/DELETE)
│   │   ├── pedidoRoutes.js       # Pedidos (GET/POST/PATCH status)
│   │   ├── estoqueRoutes.js      # Estoque (GET/POST entrada/movimentações)
│   │   └── cupomRoutes.js        # Cupons (GET/POST/PUT/DELETE + validar)
│   │
│   ├── 📁 controllers/
│   │   ├── produtoController.js  # Lógica de negócio — produtos
│   │   ├── pedidoController.js   # Lógica de negócio — pedidos + transações
│   │   ├── estoqueController.js  # Lógica de negócio — estoque
│   │   └── cupomController.js    # Lógica de negócio — cupons
│   │
│   ├── 📁 models/
│   │   └── db.js                 # Adaptador PostgreSQL (pg) — interface com Supabase
│   │
│   ├── 📁 middleware/
│   │   └── auth.js               # Verificação de JWT do Supabase (rotas admin)
│   │
│   └── 📁 config/
│       └── database.js           # Configuração do pool de conexão PostgreSQL
│
├── 📁 supabase/
│   ├── schema.sql                # DDL PostgreSQL — criação das tabelas e índices
│   └── seed.sql                  # Dados iniciais (produtos reais do cardápio)
│
├── 📁 database/
│   ├── schema.sql                # Schema SQLite (referência histórica)
│   └── seed.sql                  # Seed SQLite (referência histórica)
│
├── 📁 docs/                      # Documentação e assets do projeto
├── 📄 vercel.json                # Configuração de deploy Vercel (serverless)
├── 📄 .env.example               # Modelo de variáveis de ambiente
├── 📄 package.json               # Dependências e scripts npm
├── 📄 package-lock.json          # Lock file (versionamento exato)
└── 📄 .gitignore                 # Arquivos ignorados pelo Git
```

---

## ✅ Requisitos para Execução

- **Node.js** `>= 18.0.0` — [Download](https://nodejs.org/)
- **npm** `>= 9.0.0` (incluso com o Node.js)
- Conta no **Supabase** — [supabase.com](https://supabase.com)
- Conta no **Vercel** — [vercel.com](https://vercel.com) (para deploy)

> Verifique sua versão com:
> ```bash
> node -v
> npm -v
> ```

---

## ⚡ Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/Lucaschaves2023/terere-mix.git

# 2. Acesse a pasta do projeto
cd terere-mix

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 5. Rode o schema no Supabase (SQL Editor)
# Cole o conteúdo de supabase/schema.sql e execute
# Cole o conteúdo de supabase/seed.sql e execute

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Pronto! Acesse **http://localhost:3000** no navegador. 🎉

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o `.env.example` para `.env` e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

### 3. Iniciar em modo desenvolvimento (com hot-reload)

```bash
npm run dev
```

### 4. Iniciar em modo produção

```bash
npm start
```

### 5. Acessar o sistema

| Página | URL |
|---|---|
| 🏠 Início / Loja | http://localhost:3000/index.html |
| 🍽️ Cardápio | http://localhost:3000/cardapio.html |
| 🛒 Carrinho | http://localhost:3000/carrinho.html |
| 📦 Pedidos | http://localhost:3000/pedidos.html |
| 🔑 Login Admin | http://localhost:3000/admin-login.html |
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
# Local
http://localhost:3000/api

# Produção
https://terere-mix-2026.vercel.app/api
```

### 🔐 Autenticação

Rotas de escrita exigem o header:
```
Authorization: Bearer <jwt-token-do-supabase>
```

### 📦 Produtos — `/api/produtos`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/produtos` | Público | Lista todos os produtos ativos |
| `GET` | `/api/produtos?categoria=X` | Público | Filtra por categoria |
| `GET` | `/api/produtos/:id` | Público | Busca produto por ID |
| `POST` | `/api/produtos` | Admin | Cria novo produto |
| `PUT` | `/api/produtos/:id` | Admin | Atualiza produto existente |
| `DELETE` | `/api/produtos/:id` | Admin | Desativa produto (soft delete) |

### 🧾 Pedidos — `/api/pedidos`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/pedidos` | Admin | Lista todos os pedidos |
| `GET` | `/api/pedidos?status=pendente` | Admin | Filtra por status |
| `GET` | `/api/pedidos/:id` | Público | Busca pedido com itens |
| `POST` | `/api/pedidos` | Público | Cria novo pedido (com baixa de estoque) |
| `PATCH` | `/api/pedidos/:id/status` | Admin | Atualiza status do pedido |

**Status válidos:** `pendente` → `preparando` → `pronto` → `entregue` / `cancelado`

> ⚠️ Ao cancelar um pedido, o estoque é automaticamente devolvido.

### 📊 Estoque — `/api/estoque`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/estoque` | Admin | Lista produtos com saldo de estoque |
| `POST` | `/api/estoque/entrada` | Admin | Registra entrada manual no estoque |
| `GET` | `/api/estoque/movimentacoes` | Admin | Histórico de movimentações |

### 🏷️ Cupons — `/api/cupons`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/cupons` | Admin | Lista todos os cupons |
| `POST` | `/api/cupons/validar` | Público | Valida cupom no checkout |
| `POST` | `/api/cupons` | Admin | Cria novo cupom |
| `PUT` | `/api/cupons/:id` | Admin | Atualiza cupom |
| `DELETE` | `/api/cupons/:id` | Admin | Remove cupom |

### 🩺 Health Check

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica se o servidor está online |

---

## 🗄️ Banco de Dados

O banco de dados PostgreSQL (Supabase) é composto por **5 tabelas**:

```sql
-- Produtos cadastrados na loja
CREATE TABLE produtos (
  id        BIGSERIAL     PRIMARY KEY,
  nome      TEXT          NOT NULL,
  descricao TEXT,
  preco     NUMERIC(10,2) NOT NULL,
  categoria TEXT          NOT NULL DEFAULT 'Geral',
  imagem    TEXT,
  estoque   INTEGER       NOT NULL DEFAULT 0,
  ativo     BOOLEAN       NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ   DEFAULT now()
);

-- Pedidos realizados
CREATE TABLE pedidos (
  id             BIGSERIAL     PRIMARY KEY,
  tipo           TEXT          NOT NULL DEFAULT 'online',
  status         TEXT          NOT NULL DEFAULT 'pendente',
  nome_cliente   TEXT,
  telefone       TEXT,
  endereco       TEXT,
  total          NUMERIC(10,2) NOT NULL,
  coupon_code    TEXT,
  payment_method TEXT,
  criado_em      TIMESTAMPTZ   DEFAULT now(),
  atualizado_em  TIMESTAMPTZ   DEFAULT now()
);

-- Itens de cada pedido
CREATE TABLE itens_pedido (
  id           BIGSERIAL     PRIMARY KEY,
  pedido_id    BIGINT        NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id   BIGINT        NOT NULL REFERENCES produtos(id),
  nome_produto TEXT          NOT NULL,
  preco_unit   NUMERIC(10,2) NOT NULL,
  quantidade   INTEGER       NOT NULL
);

-- Histórico de movimentações de estoque
CREATE TABLE estoque_movimentacao (
  id         BIGSERIAL   PRIMARY KEY,
  produto_id BIGINT      NOT NULL REFERENCES produtos(id),
  tipo       TEXT        NOT NULL,
  quantidade INTEGER     NOT NULL,
  motivo     TEXT,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

-- Cupons de desconto
CREATE TABLE coupons (
  id                  BIGSERIAL     PRIMARY KEY,
  name                TEXT          NOT NULL,
  code                TEXT          NOT NULL UNIQUE,
  type                TEXT          NOT NULL DEFAULT 'percent',
  percentage          NUMERIC(5,2),
  fixed_amount        NUMERIC(10,2),
  active              BOOLEAN       NOT NULL DEFAULT true,
  expires_at          DATE,
  usage_limit         INTEGER,
  usage_count         INTEGER       NOT NULL DEFAULT 0,
  minimum_order_value NUMERIC(10,2),
  created_at          TIMESTAMPTZ   DEFAULT now()
);
```

> 📌 Para criar as tabelas no Supabase: **SQL Editor → New query** → cole `supabase/schema.sql` → Execute.
> Para popular com os produtos do cardápio: repita com `supabase/seed.sql`.

---

## 🌍 Variáveis de Ambiente

Crie um arquivo **`.env`** na raiz do projeto baseado no `.env.example`:

```env
# Porta do servidor HTTP (padrão: 3000)
PORT=3000

# Banco de Dados PostgreSQL (Supabase)
# Supabase → Connect → Direct → Transaction pooler → URI
DATABASE_URL=postgresql://postgres.SEU-PROJECT-REF:SUA-SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres

# Supabase — chaves públicas
# Supabase → Settings → API Keys → Publishable key
SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...

# Supabase — chave privada (NUNCA exponha no frontend ou no repositório)
# Supabase → Settings → JWT Keys → JWT Secret
SUPABASE_JWT_SECRET=...
```

> 🔒 O arquivo `.env` está no `.gitignore` e **nunca deve ser versionado**.

---

## 🚢 Deploy

O projeto está configurado para deploy automático na **Vercel** via `vercel.json`.

### Configuração na Vercel

1. Conecte o repositório GitHub na Vercel
2. Em **Environment Variables**, adicione:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET`
3. Clique em **Deploy**

A cada `git push` na branch `main`, a Vercel faz o redeploy automaticamente.

### Criar usuário admin

Após o deploy, crie o usuário do painel no Supabase:
**Authentication → Users → Add user → Create new user**

---

## 🌐 Páginas do Sistema

| Página | URL Produção |
|--------|-------------|
| 🏠 Início | https://terere-mix-2026.vercel.app/index.html |
| 🍽️ Cardápio | https://terere-mix-2026.vercel.app/cardapio.html |
| 🛒 Carrinho | https://terere-mix-2026.vercel.app/carrinho.html |
| 📦 Pedidos | https://terere-mix-2026.vercel.app/pedidos.html |
| 🏪 Perfil da Loja | https://terere-mix-2026.vercel.app/perfil-loja.html |
| 🔑 Login Admin | https://terere-mix-2026.vercel.app/admin-login.html |
| ⚙️ Painel Admin | https://terere-mix-2026.vercel.app/admin.html |
| 🩺 API Health | https://terere-mix-2026.vercel.app/api/health |

---

## 💡 Exemplos de Uso

### Criar um pedido via API

```bash
curl -X POST https://terere-mix-2026.vercel.app/api/pedidos \
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
curl -X PATCH https://terere-mix-2026.vercel.app/api/pedidos/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-JWT" \
  -d '{ "status": "preparando" }'
```

### Registrar entrada de estoque

```bash
curl -X POST https://terere-mix-2026.vercel.app/api/estoque/entrada \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-JWT" \
  -d '{
    "produto_id": 1,
    "quantidade": 50,
    "motivo": "Reposição semanal"
  }'
```

---

## 🔮 Melhorias Futuras

- [ ] 📱 **PWA** — Transformar o frontend em Progressive Web App para instalação mobile
- [ ] 🔔 **Notificações em Tempo Real** — WebSocket ou SSE para atualização automática de pedidos no admin
- [ ] 💳 **Integração de Pagamento** — Suporte ao Pix via API do Mercado Pago ou Stripe
- [ ] 📊 **Relatórios** — Dashboard com gráficos de vendas, produtos mais pedidos e faturamento
- [ ] 🐳 **Docker** — Containerização para facilitar desenvolvimento local sem dependências externas
- [ ] 🧪 **Testes Automatizados** — Cobertura com Jest para controllers e rotas
- [ ] 📸 **Upload de Imagens** — Integração com Supabase Storage para fotos dos produtos
- [ ] 🔒 **RLS no Supabase** — Row Level Security para camada extra de proteção no banco

---

## 👤 Autor

Desenvolvido com ☕ e 🧉 por **Lucas Chaves**

- 📧 Entre em contato via [GitHub Issues](https://github.com/Lucaschaves2023/terere-mix/issues)

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
