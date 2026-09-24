import express from 'express';
import * as marketController from '../controllers/marketController.js';
import { cacheFor } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/market/tickers
 * @desc    Cotação 24h de vários pares da Binance
 * @query   symbols - Lista separada por vírgula (ex: BTCUSDT,ETHUSDT)
 * @access  Public
 */
router.get('/tickers', cacheFor(10), marketController.getTickers);

/**
 * @route   GET /api/market/global
 * @desc    Capitalização total, volume e dominância do BTC
 * @access  Public
 */
router.get('/global', cacheFor(120), marketController.getGlobal);

/**
 * @route   GET /api/market/fear-greed
 * @desc    Índice de Medo & Ganância (30 dias)
 * @access  Public
 */
router.get('/fear-greed', cacheFor(600), marketController.getFearGreed);

/**
 * @route   GET /api/market/coins
 * @desc    Top 100 criptomoedas por capitalização
 * @access  Public
 */
router.get('/coins', cacheFor(60), marketController.getCoins);

/**
 * @route   GET /api/market/search
 * @desc    Busca criptomoedas por nome ou símbolo
 * @query   q - Texto de busca
 * @access  Public
 */
router.get('/search', cacheFor(120), marketController.search);

/**
 * @route   GET /api/market/chart/:id
 * @desc    Histórico de preços pela CoinGecko (moedas sem par na Binance)
 * @query   period - 1, 7, 30, 90, 365, max
 * @access  Public
 */
router.get('/chart/:id', cacheFor(120), marketController.getChart);

export default router;
