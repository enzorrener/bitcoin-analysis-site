# 📊 Bitcoin Analysis Site

> Plataforma profissional de análise de Bitcoin em tempo real com React.js e Node.js

![Status](https://img.shields.io/badge/status-active-success)
![Node](https://img.shields.io/badge/node-18.x-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Sobre o Projeto

Este é um sistema completo de análise de criptomoedas focado em Bitcoin, oferecendo:

- 📈 **Gráficos Interativos**: Visualização de preços em múltiplos períodos
- 💰 **Preços em Tempo Real**: Atualização automática via Binance API
- 📊 **Estatísticas de Mercado**: Métricas essenciais para investidores
- 💡 **Recomendações Estratégicas**: Análises e insights profissionais
- 🎨 **Interface Moderna**: Design responsivo e animações suaves

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React.js 18.2.0
- Vite (build tool)
- Chart.js para gráficos
- Axios para HTTP requests

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL (planejado)
- Cache em memória

**APIs Externas:**
- Binance API (dados de mercado)

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
| GET | `/api/bitcoin/history?period=7` | Histórico de preços |
| GET | `/api/bitcoin/stats` | Estatísticas gerais |

Exemplo de uso:

```bash
curl http://localhost:5000/api/bitcoin/price
```

## 🎯 Funcionalidades

### ✅ Implementadas
- [x] Backend API RESTful
- [x] Integração com Binance
- [x] Gráficos interativos
- [x] Sistema de cache
- [x] Design responsivo
- [x] Rate limiting
- [x] CORS configurado

### 🚧 Em Desenvolvimento
- [ ] Integração PostgreSQL
- [ ] Sistema de autenticação
- [ ] Alertas de preço
- [ ] WebSockets para real-time
- [ ] Dashboard de usuário

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
npm start       # Produção
npm run dev     # Desenvolvimento (nodemon)
```

### Frontend
```bash
npm run dev     # Desenvolvimento (Vite)
npm run build   # Build para produção
npm run preview # Preview do build
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` no backend:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

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