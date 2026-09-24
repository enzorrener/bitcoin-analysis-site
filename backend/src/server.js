// Carregar variáveis de ambiente (precisa ser o primeiro import)
import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bitcoinRoutes from './routes/bitcoinRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { testConnection } from './config/database.js';
import { initUserStore } from './services/userService.js';
import { startNewsJob } from './jobs/newsJob.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet()); // Headers de segurança
app.use(compression()); // Respostas comprimidas (gzip)

// CORS - Permitir requisições do frontend (aceita lista separada por vírgula)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting - Prevenir abuso da API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Limite de 300 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições deste IP, tente novamente em 15 minutos' }
});
app.use('/api/', limiter);

// Parse JSON
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ===== LOGGING DE REQUISIÇÕES (DEV) =====
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ===== ROTAS =====
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Bitcoin Analysis API',
    version: '1.0.0',
    endpoints: {
      health: '/api/bitcoin/health',
      currentPrice: '/api/bitcoin/price',
      history: '/api/bitcoin/history?period=7&symbol=BTCUSDT',
      stats: '/api/bitcoin/stats',
      tickers: '/api/market/tickers?symbols=BTCUSDT,ETHUSDT',
      global: '/api/market/global',
      fearGreed: '/api/market/fear-greed',
      coins: '/api/market/coins',
      search: '/api/market/search?q=solana',
      news: '/api/news',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me'
    }
  });
});

// Rotas da API
app.use('/api/bitcoin', bitcoinRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);

// ===== TRATAMENTO DE ERROS =====
app.use(notFound);
app.use(errorHandler);

// ===== INICIAR SERVIDOR =====
const startServer = async () => {
  try {
    // Testar conexão com banco (opcional por enquanto)
    console.log('📊 Testando conexão com PostgreSQL...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.log('⚠️  PostgreSQL não conectado (continuando sem banco por enquanto)');
    }

    // Usuários: PostgreSQL quando disponível, senão arquivo JSON local
    await initUserStore(dbConnected);

    // Rotina da aba "Notícias relevantes" (09:00 e 18:00, horário de Brasília)
    if (process.env.NEWS_JOB_ENABLED !== 'false') {
      await startNewsJob();
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`${'='.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
