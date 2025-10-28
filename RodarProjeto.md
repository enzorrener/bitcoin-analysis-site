# 🚀 Como Rodar o Projeto Bitcoin Analysis

## ✅ Status da Instalação

✅ Dependências do backend instaladas (128 pacotes)
✅ Dependências do frontend instaladas (89 pacotes)
✅ Projeto completamente configurado

---

## 🎯 Instruções Rápidas

### 1️⃣ Rodar o BACKEND

Abra um terminal e execute:

```bash
cd backend
npm run dev
```

**Saída esperada:**
```
==================================================
🚀 Servidor rodando na porta 5000
📍 URL: http://localhost:5000
🌍 Ambiente: development
==================================================
```

### 2️⃣ Rodar o FRONTEND

Abra **OUTRO terminal** (mantenha o backend rodando) e execute:

```bash
cd frontend
npm run dev
```

**Saída esperada:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 3️⃣ Acessar a Aplicação

Abra seu navegador em: **http://localhost:3000**

---

## 📋 Comandos Completos (Windows)

Se você estiver no diretório raiz do projeto:

### Terminal 1 - Backend
```bash
cd C:\Users\Enzor\Documents\GitHub\bitcoin-analysis-site\backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd C:\Users\Enzor\Documents\GitHub\bitcoin-analysis-site\frontend
npm run dev
```

---

## 🔍 Testar APIs (Opcional)

Com o backend rodando, abra outro terminal:

```bash
# Health check
curl http://localhost:5000/api/bitcoin/health

# Preço atual
curl http://localhost:5000/api/bitcoin/price

# Histórico 7 dias
curl http://localhost:5000/api/bitcoin/history?period=7

# Estatísticas
curl http://localhost:5000/api/bitcoin/stats
```

Ou abra no navegador:
- http://localhost:5000/api/bitcoin/health
- http://localhost:5000/api/bitcoin/price
- http://localhost:5000/api/bitcoin/stats

---

## ⚙️ Configuração do Banco de Dados (Futuro)

Por enquanto, o PostgreSQL é **OPCIONAL**. A aplicação funciona sem ele.

Quando quiser configurar:

1. Instale PostgreSQL
2. Crie o banco: `CREATE DATABASE bitcoin_analysis;`
3. Configure o arquivo `backend/.env` com suas credenciais
4. Reinicie o backend

---

## 🛑 Como Parar

Para parar os servidores:

- Pressione **Ctrl + C** em cada terminal
- Feche os terminais

---

## 📁 Estrutura de Arquivos Criados

```
bitcoin-analysis-site/
│
├── backend/                          ✅ Backend Node.js + Express
│   ├── src/
│   │   ├── config/database.js       ✅ Configuração PostgreSQL
│   │   ├── controllers/bitcoinController.js  ✅ Lógica de controle
│   │   ├── routes/bitcoinRoutes.js           ✅ Rotas da API
│   │   ├── services/binanceService.js        ✅ Integração Binance
│   │   ├── middleware/errorHandler.js        ✅ Tratamento de erros
│   │   └── server.js                         ✅ Servidor principal
│   ├── package.json                 ✅
│   ├── .env.example                 ✅
│   ├── .gitignore                   ✅
│   └── node_modules/                ✅ (128 pacotes instalados)
│
├── frontend/                         ✅ Frontend React.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/              ✅ TopHeader.jsx, MainHeader.jsx
│   │   │   ├── HeroStats/           ✅ HeroStats.jsx
│   │   │   ├── Chart/               ✅ BitcoinChart.jsx
│   │   │   ├── ExecutiveSummary/    ✅ ExecutiveSummary.jsx
│   │   │   ├── RecommendationCards/ ✅ RecommendationCards.jsx
│   │   │   └── Footer/              ✅ Footer.jsx
│   │   ├── services/api.js          ✅ Cliente HTTP
│   │   ├── utils/formatters.js      ✅ Funções de formatação
│   │   ├── styles/global.css        ✅ Estilos globais
│   │   ├── App.jsx                  ✅ Componente principal
│   │   └── main.jsx                 ✅ Entry point
│   ├── package.json                 ✅
│   ├── vite.config.js               ✅
│   ├── index.html                   ✅
│   ├── .gitignore                   ✅
│   └── node_modules/                ✅ (89 pacotes instalados)
│
├── README.md                         ✅ Visão geral do projeto
├── DOCUMENTACAO.md                   ✅ Documentação completa
├── INSTALACAO.md                     ✅ Guia de instalação
└── RodarProjeto.md                   ✅ Este arquivo
```

---

## 📊 Tecnologias Utilizadas

### Frontend
- **React.js 18.2.0** - Framework UI
- **Vite 5.0.8** - Build tool
- **Chart.js 4.4.0** - Gráficos
- **Axios 1.6.2** - HTTP client

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js 4.18.2** - Framework web
- **PostgreSQL** - Banco de dados (opcional)
- **Axios 1.6.2** - Cliente HTTP para APIs externas
- **node-cache 5.1.2** - Cache em memória

---

## 🎨 Funcionalidades Implementadas

✅ Backend API RESTful
✅ Integração com Binance API
✅ Sistema de cache (30s preços, 5min histórico)
✅ Frontend React.js modular
✅ Gráficos interativos Chart.js
✅ Atualização em tempo real
✅ Design responsivo
✅ Animações suaves
✅ Rate limiting
✅ CORS configurado
✅ Error handling

---

## 🗄️ Banco de Dados PostgreSQL (Planejado)

### Status Atual
⚠️ PostgreSQL está **configurado** mas é **OPCIONAL**

### Quando Implementar
O banco será usado para:
- Armazenar histórico de preços
- Sistema de autenticação de usuários
- Alertas de preço personalizados
- Dashboard de usuário
- Análises salvas

### Schema Planejado
```sql
-- Preços históricos
bitcoin_prices (id, price, high_24h, low_24h, volume_24h, timestamp)

-- Usuários
users (id, email, password_hash, created_at)

-- Alertas de preço
price_alerts (id, user_id, target_price, condition, active)
```

---

## 📚 Documentação Adicional

Para informações mais detalhadas:

- **README.md** - Visão geral e quick start
- **DOCUMENTACAO.md** - Documentação técnica completa
- **INSTALACAO.md** - Guia passo a passo de instalação

---

## 🐛 Problemas Comuns

### "Port already in use"
Mude a porta no `backend/.env`:
```env
PORT=5001
```

### "Cannot connect to database"
É normal! O banco é opcional. A aplicação funciona sem ele.

### Gráfico não carrega
1. Verifique se o backend está rodando
2. Abra F12 no navegador e veja o console
3. Verifique sua conexão com a internet

---

## ✨ Próximas Features

🚧 Integração efetiva do PostgreSQL
🚧 Sistema de autenticação
🚧 Alertas de preço
🚧 WebSockets para real-time
🚧 Dashboard de usuário
🚧 Análise técnica avançada (RSI, MACD)
🚧 Exportação de relatórios PDF
🚧 Modo escuro

---

## 📞 Suporte

Se tiver problemas:

1. Leia a **DOCUMENTACAO.md** completa
2. Verifique os logs nos terminais
3. Abra as ferramentas de desenvolvedor (F12)
4. Consulte a seção de troubleshooting na INSTALACAO.md

---

**Projeto criado com sucesso!** 🎉

Desenvolvido com React.js + Node.js + Express.js
Banco de dados: PostgreSQL (em breve)
