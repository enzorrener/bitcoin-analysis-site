import express from 'express';
import * as bitcoinController from '../controllers/bitcoinController.js';
import { cacheFor } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/bitcoin/price
 * @desc    Retorna o preço atual do Bitcoin
 * @access  Public
 */
router.get('/price', cacheFor(10), bitcoinController.getCurrentPrice);

/**
 * @route   GET /api/bitcoin/history
 * @desc    Retorna histórico de preços
 * @query   period - 1, 7, 30, 90, 365, max (default: 7)
 * @query   symbol - Par da Binance (default: BTCUSDT)
 * @access  Public
 */
router.get('/history', cacheFor(60), bitcoinController.getPriceHistory);

/**
 * @route   GET /api/bitcoin/stats
 * @desc    Retorna estatísticas gerais do mercado
 * @access  Public
 */
router.get('/stats', cacheFor(30), bitcoinController.getMarketStats);

/**
 * @route   GET /api/bitcoin/ethereum
 * @desc    Retorna o preço atual do Ethereum
 * @access  Public
 */
router.get('/ethereum', cacheFor(10), bitcoinController.getEthereumPrice);

/**
 * @route   GET /api/bitcoin/market
 * @desc    Retorna dados gerais do mercado
 * @access  Public
 */
router.get('/market', cacheFor(10), bitcoinController.getMarketOverview);

/**
 * @route   GET /api/bitcoin/health
 * @desc    Health check da API
 * @access  Public
 */
router.get('/health', bitcoinController.healthCheck);

export default router;
