import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bitcoinRoutes from './routes/bitcoinRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { testConnection } from './config/database.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet()); // Headers de segurança

// CORS - Permitir requisições do frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - Prevenir abuso da API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos'
});
app.use('/api/', limiter);

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      history: '/api/bitcoin/history?period=7',
      stats: '/api/bitcoin/stats'
    }
  });
});

// Rotas da API Bitcoin
app.use('/api/bitcoin', bitcoinRoutes);

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
