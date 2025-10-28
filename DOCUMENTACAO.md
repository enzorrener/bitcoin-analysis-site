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
├── backend/                      # API Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Configuração PostgreSQL
│   │   ├── controllers/
│   │   │   └── bitcoinController.js  # Lógica de controle
│   │   ├── routes/
│   │   │   └── bitcoinRoutes.js      # Rotas da API
│   │   ├── services/
│   │   │   └── binanceService.js     # Integração Binance API
│   │   ├── middleware/
│   │   │   └── errorHandler.js       # Tratamento de erros
│   │   └── server.js            # Servidor principal
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # Aplicação React.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/          # Cabeçalhos (TopHeader, MainHeader)
│   │   │   ├── HeroStats/       # Cards de estatísticas
│   │   │   ├── Chart/           # Gráfico Bitcoin (Chart.js)
│   │   │   ├── ExecutiveSummary/ # Resumo executivo
│   │   │   ├── RecommendationCards/ # Recomendações
│   │   │   └── Footer/          # Rodapé
│   │   ├── services/
│   │   │   └── api.js           # Cliente HTTP (Axios)
│   │   ├── utils/
│   │   │   └── formatters.js    # Funções de formatação
│   │   ├── styles/
│   │   │   └── global.css       # Estilos globais
│   │   ├── App.jsx              # Componente principal
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

### TopHeader
- Navegação principal sticky
- Ticker de preços em tempo real
- Se esconde ao fazer scroll down
- Atualiza preço a cada 30 segundos

### MainHeader
- Logo e título da aplicação
- Data formatada automaticamente

### HeroStats
- 3 cards com estatísticas principais
- Animação de entrada com Intersection Observer
- Hover effects

### ExecutiveSummary
- Resumo executivo do mercado
- Destaque para pontos de atenção

### BitcoinChart
- Gráfico interativo com Chart.js
- Seleção de períodos (7D, 30D, 90D, 1A, MÁX)
- Loading state e error handling
- Tooltip formatado com valores em USD

### RecommendationCards
- Recomendações para investidores
- Aviso legal destacado

### Footer
- Informações legais e direitos autorais

---

## 🔧 Funcionalidades Principais

### ✅ Implementadas
- [x] Backend API com Express.js
- [x] Integração com Binance API
- [x] Cache de requisições (30s para preços, 5min para histórico)
- [x] Frontend React.js com componentes modulares
- [x] Gráficos interativos com Chart.js
- [x] Sistema de atualização em tempo real
- [x] Design responsivo
- [x] Rate limiting e segurança (Helmet)
- [x] CORS configurado
- [x] Error handling robusto

### 🚧 Planejadas (Próximas Implementações)
- [ ] Conexão e uso efetivo do PostgreSQL
- [ ] Armazenamento de histórico de preços no banco
- [ ] Sistema de autenticação de usuários
- [ ] Alertas de preço personalizados
- [ ] Dashboard de usuário
- [ ] Comparação com outras criptomoedas (ETH, BNB)
- [ ] WebSockets para updates em tempo real
- [ ] Análise técnica avançada (RSI, MACD, Bollinger Bands)
- [ ] Exportação de relatórios em PDF
- [ ] Modo escuro/claro

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
3. **Rate Limiting**: 100 requisições por IP a cada 15 minutos
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
FRONTEND_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` no Git!

---

## 📦 Scripts Disponíveis

### Backend
```bash
npm start       # Inicia servidor em produção
npm run dev     # Inicia com nodemon (auto-reload)
```

### Frontend
```bash
npm run dev     # Inicia Vite dev server
npm run build   # Build para produção
npm run preview # Preview do build
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
