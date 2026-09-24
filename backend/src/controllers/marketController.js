import * as binanceService from '../services/binanceService.js';
import * as marketService from '../services/marketService.js';

const fail = (res, message, error) => {
  res.status(502).json({ success: false, message, error: error.message });
};

/**
 * Controller: Tickers 24h de vários pares (?symbols=BTCUSDT,ETHUSDT)
 */
export const getTickers = async (req, res) => {
  const symbols = String(req.query.symbols || 'BTCUSDT')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 100);

  if (!symbols.every(binanceService.isValidSymbol)) {
    return res.status(400).json({ success: false, message: 'Símbolo inválido' });
  }

  try {
    const data = await binanceService.getTickers(symbols);
    res.json({ success: true, data });
  } catch (error) {
    fail(res, 'Erro ao buscar cotações', error);
  }
};

/**
 * Controller: Dados globais do mercado (CoinGecko)
 */
export const getGlobal = async (req, res) => {
  try {
    res.json({ success: true, data: await marketService.getGlobalMarket() });
  } catch (error) {
    fail(res, 'Erro ao buscar dados globais do mercado', error);
  }
};

/**
 * Controller: Índice de Medo & Ganância
 */
export const getFearGreed = async (req, res) => {
  try {
    res.json({ success: true, data: await marketService.getFearGreed(30) });
  } catch (error) {
    fail(res, 'Erro ao buscar o Índice de Medo & Ganância', error);
  }
};

/**
 * Controller: Maiores criptomoedas por capitalização
 */
export const getCoins = async (req, res) => {
  try {
    res.json({ success: true, data: await marketService.getCoinsMarkets(100) });
  } catch (error) {
    fail(res, 'Erro ao buscar lista de criptomoedas', error);
  }
};

/**
 * Controller: Busca de criptomoedas (?q=solana)
 */
export const search = async (req, res) => {
  const query = String(req.query.q || '').trim();

  if (query.length < 2 || query.length > 50) {
    return res.status(400).json({ success: false, message: 'Digite entre 2 e 50 caracteres' });
  }

  try {
    res.json({ success: true, data: await marketService.searchCoins(query) });
  } catch (error) {
    fail(res, 'Erro ao buscar criptomoedas', error);
  }
};

/**
 * Controller: Histórico de preços pela CoinGecko (/chart/:id?period=7)
 */
export const getChart = async (req, res) => {
  const { id } = req.params;

  if (!/^[a-z0-9-]{1,80}$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Moeda inválida' });
  }

  try {
    res.json({ success: true, data: await marketService.getMarketChart(id, String(req.query.period || '7')) });
  } catch (error) {
    fail(res, 'Erro ao buscar histórico da moeda', error);
  }
};
