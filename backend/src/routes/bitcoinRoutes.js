import express from 'express';
import * as bitcoinController from '../controllers/bitcoinController.js';

const router = express.Router();

/**
 * @route   GET /api/bitcoin/price
 * @desc    Retorna o preço atual do Bitcoin
 * @access  Public
 */
router.get('/price', bitcoinController.getCurrentPrice);

/**
 * @route   GET /api/bitcoin/history
 * @desc    Retorna histórico de preços
 * @query   period - 7, 30, 90, 365, max (default: 7)
 * @access  Public
 */
router.get('/history', bitcoinController.getPriceHistory);

/**
 * @route   GET /api/bitcoin/stats
 * @desc    Retorna estatísticas gerais do mercado
 * @access  Public
 */
router.get('/stats', bitcoinController.getMarketStats);

/**
 * @route   GET /api/bitcoin/health
 * @desc    Health check da API
 * @access  Public
 */
router.get('/health', bitcoinController.healthCheck);

export default router;
