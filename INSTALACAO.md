# 🚀 Guia de Instalação - Bitcoin Analysis Site

## 📋 Requisitos do Sistema

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.x ou superior → [Download](https://nodejs.org/)
- **npm** (vem com Node.js) ou **yarn**
- **Git** → [Download](https://git-scm.com/)
- **PostgreSQL** 15+ (opcional) → [Download](https://www.postgresql.org/download/)

### Verificar instalações

```bash
node --version    # deve retornar v18.x.x ou superior
npm --version     # deve retornar 9.x.x ou superior
git --version     # deve retornar 2.x.x ou superior
```

---

## 📥 Passo 1: Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/bitcoin-analysis-site.git

# Entre no diretório
cd bitcoin-analysis-site

# Verifique a estrutura
ls -la
# Você deve ver: backend/ frontend/ README.md DOCUMENTACAO.md
```

---

## 🔧 Passo 2: Configurar o Backend

### 2.1 Navegar para o backend

```bash
cd backend
```

### 2.2 Instalar dependências

```bash
npm install
```

Isso instalará:
- express
- cors
- dotenv
- axios
- pg (PostgreSQL)
- node-cache
- helmet
- express-rate-limit
- nodemon (dev)

### 2.3 Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env
# No Windows: notepad .env
# No Linux/Mac: nano .env
```

Conteúdo do `.env`:

```env
# Servidor
PORT=5000
NODE_ENV=development

# PostgreSQL (opcional por enquanto)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_analysis
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# APIs Externas (já configuradas)
BINANCE_API_URL=https://api.binance.com/api/v3
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# CORS
FRONTEND_URL=http://localhost:3000

# Cache (em segundos)
CACHE_TTL_PRICE=30
CACHE_TTL_HISTORY=300
```

### 2.4 Iniciar o backend

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# OU modo produção
npm start
```

Você deverá ver:

```
==================================================
🚀 Servidor rodando na porta 5000
📍 URL: http://localhost:5000
🌍 Ambiente: development
==================================================
```

### 2.5 Testar o backend

Abra outro terminal e teste:

```bash
# Health check
curl http://localhost:5000/api/bitcoin/health

# Preço atual
curl http://localhost:5000/api/bitcoin/price

# Estatísticas
curl http://localhost:5000/api/bitcoin/stats
```

Ou abra no navegador: http://localhost:5000

---

## ⚛️ Passo 3: Configurar o Frontend

### 3.1 Abrir novo terminal e navegar para frontend

```bash
# Abra um NOVO terminal (mantenha o backend rodando)
cd bitcoin-analysis-site/frontend
```

### 3.2 Instalar dependências

```bash
npm install
```

Isso instalará:
- react
- react-dom
- axios
- chart.js
- react-chartjs-2
- vite
- @vitejs/plugin-react

### 3.3 Iniciar o frontend

```bash
npm run dev
```

Você deverá ver:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 3.4 Acessar a aplicação

Abra seu navegador em: **http://localhost:3000**

---

## ✅ Passo 4: Verificar Funcionamento

### 4.1 Checklist de Funcionamento

- [ ] Backend rodando em http://localhost:5000
- [ ] Frontend rodando em http://localhost:3000
- [ ] Página carrega sem erros
- [ ] Header sticky funciona ao rolar
- [ ] Preço do Bitcoin aparece no ticker
- [ ] Cards de estatísticas carregam
- [ ] Gráfico renderiza com dados
- [ ] Botões de período (7D, 30D, etc) funcionam
- [ ] Gráfico atualiza ao trocar período
- [ ] Console sem erros críticos

### 4.2 Verificar Console do Navegador

Abra as ferramentas de desenvolvedor (F12) e verifique a aba Console:

Você deve ver logs como:
```
🔵 API Request: GET /bitcoin/price
🟢 API Response: 200 /bitcoin/price
```

Se houver erros em vermelho, verifique a seção de troubleshooting.

---

## 🗄️ Passo 5: Configurar PostgreSQL (Opcional)

### 5.1 Instalar PostgreSQL

Se ainda não tem PostgreSQL:

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Execute o instalador
- Defina uma senha para o usuário `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 5.2 Criar o banco de dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# No prompt do PostgreSQL:
CREATE DATABASE bitcoin_analysis;

# Listar bancos (verificar criação)
\l

# Sair
\q
```

### 5.3 Atualizar .env do backend

Edite `backend/.env` com as credenciais corretas:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_analysis
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
```

### 5.4 Reiniciar o backend

```bash
# Ctrl+C para parar
# Depois iniciar novamente
npm run dev
```

Você deve ver:
```
📊 Testando conexão com PostgreSQL...
✅ Conectado ao PostgreSQL
🕐 Database time: 2025-01-27 10:30:00
```

---

## 🛠️ Troubleshooting

### Erro: "Port 5000 already in use"

**Solução:**
```bash
# Encontrar processo usando a porta
# Windows:
netstat -ano | findstr :5000

# Linux/Mac:
lsof -i :5000

# Matar o processo ou mudar a porta no .env
PORT=5001
```

### Erro: "Cannot connect to database"

**Soluções:**
1. Verificar se PostgreSQL está rodando
   ```bash
   # Windows: Services → PostgreSQL
   # Linux: sudo systemctl status postgresql
   # Mac: brew services list
   ```

2. Verificar credenciais no `.env`

3. Por enquanto, o sistema funciona sem banco de dados conectado

### Erro: "CORS blocked"

**Solução:**
Verifique se `FRONTEND_URL` no backend `.env` está correto:
```env
FRONTEND_URL=http://localhost:3000
```

### Gráfico não carrega

**Soluções:**
1. Verificar se o backend está respondendo:
   ```bash
   curl http://localhost:5000/api/bitcoin/history?period=7
   ```

2. Verificar conexão com internet (precisa acessar Binance API)

3. Abrir console do navegador (F12) para ver erros detalhados

### Erro: "Module not found"

**Solução:**
Reinstalar dependências:
```bash
# Remover node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

---

## 🚀 Comandos Úteis

### Backend

```bash
# Iniciar em desenvolvimento
npm run dev

# Iniciar em produção
npm start

# Ver logs
# Os logs aparecem no terminal automaticamente
```

### Frontend

```bash
# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Limpar cache
rm -rf node_modules/.vite
```

---

## 📦 Build para Produção

### Frontend

```bash
cd frontend
npm run build

# Arquivos de produção estarão em: frontend/dist/
```

### Backend

```bash
cd backend

# Mudar NODE_ENV no .env
NODE_ENV=production

# Iniciar
npm start
```

---

## 🔐 Segurança em Produção

Antes de fazer deploy:

1. **Mudar NODE_ENV:**
   ```env
   NODE_ENV=production
   ```

2. **Usar HTTPS:**
   - Configure SSL/TLS
   - Nunca use HTTP em produção

3. **Variáveis de ambiente seguras:**
   - Nunca commite o arquivo `.env`
   - Use secrets do seu provedor de hosting

4. **Rate limiting:**
   - Já configurado no backend
   - Ajuste conforme necessário

5. **Banco de dados:**
   - Use credenciais fortes
   - Configure firewall
   - Backups regulares

---

## 📚 Próximos Passos

Após instalação bem-sucedida:

1. Leia a [DOCUMENTACAO.md](./DOCUMENTACAO.md) completa
2. Explore os componentes em `frontend/src/components/`
3. Explore as rotas da API em `backend/src/routes/`
4. Customize o projeto conforme suas necessidades

---

## 🆘 Precisa de Ajuda?

- Consulte: [DOCUMENTACAO.md](./DOCUMENTACAO.md)
- Abra uma issue: [GitHub Issues](https://github.com/seu-usuario/bitcoin-analysis-site/issues)
- Verifique os logs nos terminais do backend e frontend

---

**Última atualização**: Janeiro 2025
