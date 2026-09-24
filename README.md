# 📊 Bitcoin Analysis Site

> Plataforma profissional de análise de Bitcoin em tempo real com React.js e Node.js

![Status](https://img.shields.io/badge/status-active-success)
![Node](https://img.shields.io/badge/node-18.x-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Sobre o Projeto

Este é um sistema completo de análise de criptomoedas focado em Bitcoin, oferecendo:

- 📈 **Gráficos Interativos**: Períodos de 24h até o histórico completo, com médias móveis
- 💰 **Preços em Tempo Real**: WebSocket da Binance, em US$ ou R$
- 📊 **Dados Reais de Mercado**: Medo & Ganância, dominância, capitalização e indicadores técnicos
- 📰 **Notícias Relevantes**: Nova aba atualizada todos os dias às 09:00 e 18:00 (Brasília)
- 🔐 **Cadastro e Login**: Painel pessoal com busca de preços, favoritas e conversor
- 💡 **Recomendações Estratégicas**: Sinais calculados a partir dos indicadores
- 🎨 **Interface Moderna**: Design responsivo, menu mobile e carregamento sob demanda

🌐 **Site publicado:** https://enzorrener.github.io/bitcoin-analysis-site/

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React.js 18.2.0 + React Router
- Vite (build tool)
- Chart.js para gráficos
- Fetch API nativa (sem dependências extras)

**Backend:**
- Node.js 18+
- Express.js
- node-cron (rotina de notícias)
- bcrypt + JWT (autenticação)
- PostgreSQL (opcional; sem banco os usuários ficam em arquivo JSON)
- Cache em memória

**APIs Externas:**
- Binance API (cotações, histórico e WebSocket)
- CoinGecko (capitalização, dominância, top 100 e busca)
- Alternative.me (Índice de Medo & Ganância)
- Feeds RSS de portais de notícias cripto

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn
- PostgreSQL 15+ (opcional, para funcionalidades futuras)

## ⚙️ Instalação Rápida

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/bitcoin-analysis-site.git
cd bitcoin-analysis-site
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env conforme necessário
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### 3. Configure o Frontend

```bash
# Em outro terminal
cd frontend
npm install
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 📖 Documentação Completa

Para documentação detalhada, incluindo:
- Arquitetura do projeto
- Estrutura de pastas
- API Endpoints
- Schema do banco de dados
- Guia de desenvolvimento

Leia: **[DOCUMENTACAO.md](./DOCUMENTACAO.md)**

## 🔌 API Endpoints

### Principais Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/bitcoin/health` | Status da API |
| GET | `/api/bitcoin/price` | Preço atual do Bitcoin |
| GET | `/api/bitcoin/history?period=7&symbol=BTCUSDT` | Histórico de preços |
| GET | `/api/bitcoin/stats` | Estatísticas gerais |
| GET | `/api/market/tickers?symbols=BTCUSDT,ETHUSDT` | Cotações de vários pares |
| GET | `/api/market/global` | Capitalização e dominância |
| GET | `/api/market/fear-greed` | Índice de Medo & Ganância |
| GET | `/api/market/coins` | Top 100 criptomoedas |
| GET | `/api/market/search?q=solana` | Busca de criptomoedas |
| GET | `/api/news` | Notícias relevantes |
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Entrar |
| GET | `/api/auth/me` | Usuário logado |

Exemplo de uso:

```bash
curl http://localhost:5000/api/bitcoin/price
```

## 🎯 Funcionalidades

### ✅ Implementadas
- [x] Backend API RESTful
- [x] Integração com Binance, CoinGecko e Alternative.me
- [x] Preços em tempo real (WebSocket)
- [x] Gráficos interativos com médias móveis
- [x] Aba "Notícias relevantes" com rotina às 09:00 e 18:00
- [x] Sistema de autenticação (cadastro, login, JWT)
- [x] Painel do usuário com busca de preços, favoritas e conversor
- [x] Sistema de cache
- [x] Design responsivo
- [x] Rate limiting
- [x] CORS configurado
- [x] Deploy automático no GitHub Pages

### 🚧 Em Desenvolvimento
- [ ] Alertas de preço
- [ ] Favoritas sincronizadas no servidor
- [ ] Histórico de preços no PostgreSQL

## 📰 Rotina de Notícias

A aba **Notícias relevantes** é atualizada todos os dias às **09:00 e 18:00 (horário de Brasília)**:

- **Servidor Node**: rotina `node-cron` (`backend/src/jobs/newsJob.js`) com fuso `America/Sao_Paulo`.
- **Site publicado**: GitHub Actions (`.github/workflows/deploy.yml`) às 12:00 e 21:00 UTC, que coleta as
  notícias e publica o site novamente.

Coleta manual: `cd backend && npm run news:update`

## 🌐 Publicação (GitHub Pages)

1. Em **Settings → Pages → Build and deployment**, selecione **Source: GitHub Actions** (apenas uma vez).
2. Cada push na `main` publica o site em https://enzorrener.github.io/bitcoin-analysis-site/.

No site publicado não há servidor: os dados vêm direto das APIs públicas e o cadastro funciona em modo
demonstração (conta salva no navegador). Rodando localmente com o backend, o cadastro usa a API com JWT.

## 📁 Estrutura do Projeto

```
bitcoin-analysis-site/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── controllers/ # Controladores
│   │   ├── routes/      # Rotas da API
│   │   ├── services/    # Lógica de negócio
│   │   └── middleware/  # Middlewares
│   └── package.json
│
├── frontend/            # Aplicação React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── services/    # Cliente API
│   │   ├── utils/       # Funções auxiliares
│   │   └── styles/      # Estilos globais
│   └── package.json
│
├── DOCUMENTACAO.md      # Documentação completa
└── README.md           # Este arquivo
```

## 🛠️ Scripts Disponíveis

### Backend
```bash
npm start            # Produção
npm run dev          # Desenvolvimento (nodemon)
npm run news:update  # Coleta as notícias agora
```

### Frontend
```bash
npm run dev          # Desenvolvimento (Vite)
npm run build        # Build para produção (com backend)
npm run build:static # Build para GitHub Pages (sem backend)
npm run preview      # Preview do build
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` no backend:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000,http://localhost:4173

# Autenticação
JWT_SECRET=uma_chave_longa_e_aleatoria
JWT_EXPIRES_IN=7d

# Rotina de notícias (09:00 e 18:00, Brasília)
NEWS_JOB_ENABLED=true

# PostgreSQL (opcional por enquanto)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_analysis
DB_USER=postgres
DB_PASSWORD=sua_senha
```

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/seu-usuario/bitcoin-analysis-site/issues) com:
- Descrição do problema
- Passos para reproduzir
- Comportamento esperado
- Screenshots (se aplicável)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ⚠️ Aviso Legal

Este projeto é para fins educacionais. As análises e recomendações não constituem aconselhamento financeiro profissional. Invista com responsabilidade.

## 📧 Contato

- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@example.com

---

**Desenvolvido com ❤️ usando React.js e Node.js**

⭐ Se este projeto foi útil, considere dar uma estrela!