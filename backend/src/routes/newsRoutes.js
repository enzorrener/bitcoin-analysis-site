import express from 'express';
import * as newsController from '../controllers/newsController.js';
import { cacheFor } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/news
 * @desc    Notícias relevantes do mercado cripto
 *          (rotina atualiza às 09:00 e 18:00, horário de Brasília)
 * @access  Public
 */
router.get('/', cacheFor(300), newsController.getNews);

export default router;
