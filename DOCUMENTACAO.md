# 📊 Bitcoin Analysis Site - Documentação Completa

## 🎯 Visão Geral do Projeto

Este é um projeto de análise de Bitcoin em tempo real que foi migrado de uma aplicação HTML/CSS/JavaScript pura para uma arquitetura moderna com **React.js** no frontend e **Node.js + Express.js** no backend.

### Objetivo
Fornecer análises profissionais do mercado de Bitcoin, incluindo:
- Preços em tempo real
- Gráficos históricos interativos
- Estatísticas de mercado
- Recomendações estratégicas para investidores

---

## 🏗️ Arquitetura do Projeto

```
bitcoin-analysis-site/
│
├── .github/workflows/
│   └── deploy.yml                # Deploy no GitHub Pages + rotina de notícias (09:00 e 18:00)
│
├── backend/                      # API Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js           # Carrega o .env
│   │   │   └── database.js      # Configuração PostgreSQL
│   │   ├── controllers/
│   │   │   ├── bitcoinController.js  # Preço, histórico e estatísticas
│   │   │   ├── marketController.js   # Cotações, mercado global, busca
│   │   │   ├── newsController.js     # Notícias relevantes
│   │   │   └── authController.js     # Cadastro e login
│   │   ├── routes/              # bitcoin, market, news e auth
│   │   ├── services/
│   │   │   ├── binanceService.js     # Integração Binance API
│   │   │   ├── marketService.js      # CoinGecko + Medo & Ganância
│   │   │   ├── newsService.js        # Coleta e ranking de notícias (RSS)
│   │   │   ├── authService.js        # bcrypt + JWT
│   │   │   └── userService.js        # Usuários (PostgreSQL ou arquivo JSON)
│   │   ├── jobs/
│   │   │   └── newsJob.js            # Rotina node-cron 09:00 e 18:00 (Brasília)
│   │   ├── scripts/
│   │   │   └── updateNews.js         # Gera o news.json (usado no deploy)
│   │   ├── middleware/          # Erros, autenticação JWT e cache HTTP
│   │   └── server.js            # Servidor principal
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # Aplicação React.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/          # Menu (TopHeader) e destaque inicial (MainHeader)
│   │   │   ├── TickerBar/       # Faixa de cotações ao vivo
│   │   │   ├── HeroStats/       # Medo & Ganância, dominância, capitalização, volume
│   │   │   ├── ExecutiveSummary/ # Resumo gerado com dados reais
│   │   │   ├── Chart/           # Gráfico (Chart.js) + análise técnica
│   │   │   ├── RecommendationCards/ # Sinais calculados pelos indicadores
│   │   │   ├── News/            # Aba "Notícias relevantes" e widget
│   │   │   ├── Login/           # Tela de login (layout compartilhado)
│   │   │   ├── Register/        # Tela de cadastro
│   │   │   ├── Painel/          # Tela principal após entrar
│   │   │   ├── CryptoSearch/    # Busca e tabela de preços
│   │   │   ├── Converter/       # Conversor cripto x BRL/USD
│   │   │   └── ...              # Ícones, Sparkline, LivePrice, Layout, Footer
│   │   ├── context/             # Sessão (AuthContext) e moeda (PreferencesContext)
│   │   ├── hooks/               # useAsync, useLivePrices, useMarketAnalysis...
│   │   ├── services/
│   │   │   ├── api.js           # Backend com fallback para APIs públicas
│   │   │   ├── auth.js          # Cadastro/login (backend ou navegador)
│   │   │   └── liveTicker.js    # WebSocket da Binance compartilhado
│   │   ├── utils/               # Formatadores, indicadores técnicos, moedas
│   │   ├── styles/global.css    # Tokens de design e estilos globais
│   │   ├── App.jsx              # Rotas (carregamento sob demanda)
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── DOCUMENTACAO.md               # Este arquivo
```

---

## 💻 Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React.js** | 18.2.0 | Biblioteca UI para componentes reativos |
| **Vite** | 5.0.8 | Build tool moderna e rápida |
| **Chart.js** | 4.4.0 | Biblioteca para gráficos interativos |
| **react-chartjs-2** | 5.2.0 | Wrapper React para Chart.js |
| **Axios** | 1.6.2 | Cliente HTTP para chamadas API |

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express.js** | 4.18.2 | Framework web minimalista |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **pg** | 8.11.3 | Driver PostgreSQL para Node.js |
| **Axios** | 1.6.2 | Cliente HTTP para APIs externas |
| **node-cache** | 5.1.2 | Sistema de cache em memória |
| **helmet** | 7.1.0 | Middleware de segurança |
| **cors** | 2.8.5 | Middleware CORS |
| **dotenv** | 16.3.1 | Variáveis de ambiente |

---

## 🗄️ Banco de Dados - PostgreSQL

### Por que PostgreSQL?
- **Relacional e estruturado**: Perfeito para dados financeiros que exigem integridade
- **Performance**: Excelente para consultas complexas e agregações
- **ACID compliant**: Garante transações seguras
- **Extensível**: Suporte a JSON, TimescaleDB para séries temporais, etc.

### Schema Planejado (Implementação Futura)

```sql
-- Tabela de preços históricos
CREATE TABLE bitcoin_prices (
    id SERIAL PRIMARY KEY,
    price NUMERIC(18, 8) NOT NULL,
    high_24h NUMERIC(18, 8),
    low_24h NUMERIC(18, 8),
    volume_24h NUMERIC(20, 8),
    change_24h NUMERIC(10, 4),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'binance'
);

-- Tabela de usuários (para futuras features)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de alertas de preço
CREATE TABLE price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_price NUMERIC(18, 8) NOT NULL,
    condition VARCHAR(10) CHECK (condition IN ('above', 'below')),
    active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_bitcoin_prices_timestamp ON bitcoin_prices(timestamp DESC);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(active) WHERE active = TRUE;
```

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Pré-requisitos

```bash
# Node.js 18+ instalado
node --version  # deve retornar v18.x.x ou superior

# PostgreSQL 15+ instalado (opcional por enquanto)
psql --version
```

### 2️⃣ Configuração do Backend

```bash
# Navegar para a pasta backend
cd backend

# Instalar dependências
npm install

# Criar arquivo .env baseado no .env.example
cp .env.example .env

# Editar o .env com suas configurações
# (Por enquanto, o banco PostgreSQL é opcional)

# Iniciar servidor em modo desenvolvimento
npm run dev

# O servidor rodará em http://localhost:5000
```

### 3️⃣ Configuração do Frontend

```bash
# Abrir outro terminal e navegar para frontend
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação em modo desenvolvimento
npm run dev

# A aplicação rodará em http://localhost:3000
```

### 4️⃣ Acessar a Aplicação

Abra seu navegador em: **http://localhost:3000**

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/bitcoin/health` | Status da API |
| GET | `/bitcoin/price` | Preço atual do Bitcoin |
| GET | `/bitcoin/history?period=7&symbol=BTCUSDT` | Histórico (1, 7, 30, 90, 365, max) de qualquer par |
| GET | `/bitcoin/stats` | Preço + Medo & Ganância + dominância + capitalização |
| GET | `/market/tickers?symbols=BTCUSDT,ETHUSDT` | Cotação 24h de vários pares |
| GET | `/market/global` | Capitalização total, volume e dominância |
| GET | `/market/fear-greed` | Índice de Medo & Ganância (30 dias) |
| GET | `/market/coins` | Top 100 criptomoedas |
| GET | `/market/search?q=solana` | Busca de criptomoedas com preço |
| GET | `/market/chart/:id?period=7` | Histórico pela CoinGecko |
| GET | `/news` | Notícias relevantes (09:00 e 18:00) |
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Entrar |
| GET | `/auth/me` | Usuário logado (Bearer token) |

#### 1. Health Check
```http
GET /api/bitcoin/health
```
**Resposta:**
```json
{
  "success": true,
  "message": "API Bitcoin Analysis está funcionando!",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### 2. Preço Atual
```http
GET /api/bitcoin/price
```
**Resposta:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC/USD",
    "price": 118240.50,
    "change24h": 2.4,
    "high24h": 119800.00,
    "low24h": 115000.00,
    "volume24h": 28500000000,
    "timestamp": 1706356800000
  }
}
```

#### 3. Histórico de Preços
```http
GET /api/bitcoin/history?period=7
```
**Parâmetros:**
- `period`: 7 | 30 | 90 | 365 | max (padrão: 7)

**Resposta:**
```json
{
  "success": true,
  "period": "7",
  "dataPoints": 168,
  "data": [
    {
      "timestamp": 1706356800000,
      "date": "2025-01-27T08:00:00.000Z",
      "open": 117500.00,
      "high": 118500.00,
      "low": 117000.00,
      "close": 118240.00,
      "volume": 1500000000
    }
    // ... mais pontos
  ]
}
```

#### 4. Estatísticas do Mercado
```http
GET /api/bitcoin/stats
```
**Resposta:**
```json
{
  "success": true,
  "data": {
    "currentPrice": 118240.50,
    "change24h": 2.4,
    "high24h": 119800.00,
    "low24h": 115000.00,
    "volume24h": 28500000000,
    "targetPrice2025": 140000,
    "resistance": 115000,
    "sentiment": "Alta"
  }
}
```

---

## 🎨 Componentes React

### Rotas
| Rota | Tela | Acesso |
|------|------|--------|
| `/` | Dashboard com análise do Bitcoin | Público |
| `/noticias` | Notícias relevantes | Público |
| `/login` | Entrar | Público |
| `/cadastro` | Criar conta | Público |
| `/app` | Meu Painel (gráfico, busca de preços, favoritas, conversor) | Logado |

### TopHeader + TickerBar
- Menu com abas, seletor de moeda (US$ / R$), sino com notícias novas e menu da conta
- Faixa de cotações ao vivo via WebSocket da Binance
- Se esconde ao rolar para baixo (listener passivo + requestAnimationFrame)
- Menu lateral no celular

### MainHeader
- Título, data do relatório e preço do BTC ao vivo com mini gráfico de 24h

### HeroStats
- Índice de Medo & Ganância, dominância do BTC, capitalização total e volume global (dados reais)

### ExecutiveSummary
- Texto gerado a partir dos dados reais: variação 24h/7d/30d/ano, médias móveis, RSI, mercado global e destaque do dia

### BitcoinChart
- Gráfico com períodos 24H, 7D, 30D, 90D, 1A e MÁX
- Médias móveis MM20 e MM50 opcionais
- Último ponto atualizado em tempo real
- Suporte, resistência, MM50, MM200, RSI e volatilidade calculados dos candles diários
- Reutilizado no Painel para qualquer moeda (fallback para CoinGecko quando não há par na Binance)

### RecommendationCards
- Sinal educativo calculado pela tendência (MM200), RSI e Medo & Ganância, com os motivos exibidos

### NewsPage (aba Notícias relevantes)
- Destaque + grade de notícias, filtros por categoria e origem, busca e ordenação
- Mostra horário da última e da próxima atualização (09:00 e 18:00)

### Painel (após login)
- KPIs do mercado, gráfico da moeda selecionada, busca com atalho `/`, tabela ordenável com preços ao vivo, favoritas por usuário, conversor e últimas notícias

### Login e Register
- Validação em tempo real, força da senha, mostrar/ocultar senha
- Redireciona para o Painel após entrar

---

## 📰 Rotina de Notícias Relevantes

As notícias são coletadas de feeds RSS (Portal do Bitcoin, Livecoins, CriptoFácil, BeInCrypto Brasil,
Cointelegraph Brasil, Money Times, CoinDesk e Decrypt), classificadas por categoria, pontuadas por relevância
(palavras-chave + recência + quantidade de portais que repercutiram, com prioridade para portais em português)
e deduplicadas. As fontes ficam em `NEWS_SOURCES` (`backend/src/services/newsService.js`) e aceitam endereços
alternativos caso algum portal mude o link do feed.

A atualização acontece **todos os dias às 09:00 e 18:00 (horário de Brasília)** em dois lugares:

1. **Backend (servidor rodando)**: `node-cron` com `timezone: America/Sao_Paulo` (`src/jobs/newsJob.js`).
   Se o servidor ficou desligado no horário, a coleta roda ao iniciar. O resultado fica em `backend/data/news.json`
   e é servido em `GET /api/news`.
2. **GitHub Actions (site publicado)**: `.github/workflows/deploy.yml` roda às 12:00 e 21:00 UTC
   (09:00 e 18:00 em Brasília), gera `data/news.json` e publica o site novamente.
   O GitHub pode atrasar execuções agendadas em alguns minutos.

Para rodar a coleta manualmente: `cd backend && npm run news:update`.

---

## 🔑 Autenticação

- `POST /api/auth/register` → `{ name, email, password }` (senha com 8+ caracteres, letras e números)
- `POST /api/auth/login` → `{ email, password }`
- `GET /api/auth/me` → header `Authorization: Bearer <token>`

Senhas com **bcrypt**, sessão com **JWT** (`JWT_SECRET`, validade `JWT_EXPIRES_IN`). Os usuários ficam no
PostgreSQL quando conectado (tabela `users` criada automaticamente) ou em `backend/data/users.json`.
Rotas de autenticação têm limite de 30 tentativas a cada 15 minutos.

No site estático (GitHub Pages, sem servidor) o cadastro funciona em **modo demonstração**: a conta fica
salva apenas no navegador, com a senha protegida por PBKDF2.

---

## 🌐 Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` gera o frontend em modo estático (`npm run build:static`), no qual
o navegador consulta diretamente Binance, CoinGecko e Alternative.me, e publica em
`https://enzorrener.github.io/bitcoin-analysis-site/`.

Configuração única: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Pushes em outras branches apenas validam o build; a publicação acontece na branch `main`,
no agendamento das notícias e pelo botão *Run workflow*.

---

## 🔧 Funcionalidades Principais

### ✅ Implementadas
- [x] Backend API com Express.js
- [x] Integração com Binance API (cotações de vários pares em uma única requisição)
- [x] Dados de mercado reais: CoinGecko (capitalização, dominância, top 100) e Alternative.me (Medo & Ganância)
- [x] Preços em tempo real via WebSocket da Binance (com fallback para consulta periódica)
- [x] Aba "Notícias relevantes" com rotina às 09:00 e 18:00 (Brasília)
- [x] Cadastro, login e tela principal protegida (JWT + bcrypt)
- [x] Busca de preços de criptomoedas, favoritas e conversor BRL/USD
- [x] Indicadores técnicos (MM20, MM50, MM200, RSI, suporte/resistência, volatilidade)
- [x] Exibição em US$ ou R$
- [x] Cache de requisições no backend e no frontend
- [x] Carregamento sob demanda das páginas e do Chart.js
- [x] Design responsivo com menu mobile
- [x] Rate limiting, Helmet, compressão gzip e CORS
- [x] Deploy automático no GitHub Pages

### 🚧 Planejadas (Próximas Implementações)
- [ ] Armazenamento de histórico de preços no banco
- [ ] Alertas de preço personalizados
- [ ] Favoritas sincronizadas no servidor
- [ ] Exportação de relatórios em PDF
- [ ] Modo claro

---

## 🎯 Estrutura de Cache

O backend implementa cache em memória para otimizar performance:

```javascript
// Preço atual: 30 segundos TTL
cache.set('btc_current_price', data, 30);

// Histórico: 5 minutos TTL
cache.set(`btc_history_${interval}_${limit}`, data, 300);
```

Benefícios:
- Reduz chamadas à API externa (Binance)
- Melhora latência das respostas
- Evita rate limiting da Binance

---

## 🔐 Segurança

### Medidas Implementadas
1. **Helmet.js**: Headers de segurança HTTP
2. **CORS**: Apenas frontend autorizado pode acessar
3. **Rate Limiting**: 300 requisições por IP a cada 15 minutos (30 nas rotas de login/cadastro)
4. **Validação de inputs**: Parâmetros verificados nos controllers
5. **Error handling**: Erros não expõem detalhes internos em produção

### Variáveis de Ambiente (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_analysis
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
FRONTEND_URL=http://localhost:3000,http://localhost:4173
JWT_SECRET=uma_chave_longa_e_aleatoria
JWT_EXPIRES_IN=7d
NEWS_JOB_ENABLED=true
COINGECKO_API_KEY=            # opcional
```

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` no Git!

---

## 📦 Scripts Disponíveis

### Backend
```bash
npm start            # Inicia servidor em produção
npm run dev          # Inicia com nodemon (auto-reload)
npm run news:update  # Coleta as notícias relevantes agora
```

### Frontend
```bash
npm run dev          # Inicia Vite dev server
npm run build        # Build para produção (usa o backend em /api)
npm run build:static # Build para GitHub Pages (sem backend)
npm run preview      # Preview do build
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Por enquanto, o sistema funciona sem banco de dados

### Erro: "CORS blocked"
- Verifique se `FRONTEND_URL` no `.env` está correto
- Certifique-se que o frontend roda em `http://localhost:3000`

### Gráfico não carrega
- Verifique se o backend está rodando em `http://localhost:5000`
- Abra o console do navegador para ver erros detalhados
- Verifique conexão com a internet (precisa acessar Binance API)

---

## 📚 Recursos e Referências

### APIs Externas
- **Binance API**: https://binance-docs.github.io/apidocs/spot/en/
- **CoinGecko API** (backup): https://www.coingecko.com/en/api

### Documentação
- **React**: https://react.dev/
- **Express.js**: https://expressjs.com/
- **Chart.js**: https://www.chartjs.org/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 👥 Para Desenvolvedores e IAs

### Conceitos-Chave do Projeto

1. **Separação de Responsabilidades**:
   - Backend: API REST, lógica de negócio, integrações externas
   - Frontend: UI, experiência do usuário, visualizações

2. **Componentização**:
   - Cada parte da UI é um componente React isolado
   - Props para passar dados entre componentes
   - Hooks (useState, useEffect) para gerenciar estado

3. **Fluxo de Dados**:
   ```
   Binance API → Backend Service → Controller → Route → Frontend API Client → React Component → UI
   ```

4. **Cache Strategy**:
   - Dados voláteis (preço atual): TTL curto (30s)
   - Dados estáticos (histórico): TTL longo (5min)

5. **Error Handling**:
   - Try/catch em todas as chamadas async
   - Fallback UI para erros no frontend
   - Logs detalhados no backend

### Próximos Passos para Expansão

1. **Integrar PostgreSQL de verdade**:
   - Criar tabelas conforme schema documentado
   - Implementar repositories/models
   - Adicionar migrations (Prisma ou Sequelize)

2. **Adicionar Autenticação**:
   - JWT tokens
   - Bcrypt para senhas
   - Middleware de autorização

3. **WebSockets para Real-Time**:
   - Socket.io
   - Atualização instantânea de preços

4. **Testes**:
   - Jest para testes unitários
   - React Testing Library para componentes
   - Supertest para testes de API

---

## 📝 Licença

Este projeto é para fins educacionais. Não constitui aconselhamento financeiro.

---

## 📞 Contato

Para dúvidas sobre o projeto, abra uma issue no repositório.

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
