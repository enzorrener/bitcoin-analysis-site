import axios from 'axios';
import NodeCache from 'node-cache';

const BINANCE_API = process.env.BINANCE_API_URL || 'https://api.binance.com/api/v3';

// Cache para reduzir chamadas à API (TTL padrão de 30 segundos)
const cache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL_PRICE) || 30 });
const HISTORY_TTL = Number(process.env.CACHE_TTL_HISTORY) || 300;

const http = axios.create({ baseURL: BINANCE_API, timeout: 10000 });

// Moedas usadas para calcular o humor geral do mercado
const MARKET_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

const SYMBOL_REGEX = /^[A-Z0-9]{2,20}$/;

export const isValidSymbol = (symbol) => SYMBOL_REGEX.test(symbol);

/**
 * Normaliza o ticker 24h da Binance para o formato usado pela API
 */
const normalizeTicker = (ticker) => {
  const base = ticker.symbol.replace(/(USDT|BRL|USDC|FDUSD)$/, '');
  const quote = ticker.symbol.slice(base.length);

  return {
    symbol: ticker.symbol,
    base,
    quote,
    price: parseFloat(ticker.lastPrice),
    open24h: parseFloat(ticker.openPrice),
    change24h: parseFloat(ticker.priceChangePercent),
    changeAbs24h: parseFloat(ticker.priceChange),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
    volume24h: parseFloat(ticker.volume),
    quoteVolume24h: parseFloat(ticker.quoteVolume),
    timestamp: ticker.closeTime || Date.now()
  };
};

/**
 * Busca tickers 24h de vários pares em UMA única requisição
 * @param {string[]} symbols - Ex: ['BTCUSDT', 'ETHUSDT']
 * @returns {Promise<Array>} Lista de tickers normalizados
 */
export const getTickers = async (symbols) => {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(isValidSymbol).sort();
  if (unique.length === 0) return [];

  const cacheKey = `tickers_${unique.join(',')}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await http.get('/ticker/24hr', {
      params: { symbols: JSON.stringify(unique) }
    });

    const data = response.data.map(normalizeTicker);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    // Um símbolo inexistente faz a Binance recusar o lote inteiro:
    // nesse caso tentamos um a um e descartamos os inválidos.
    if (error.response?.status === 400 && unique.length > 1) {
      const results = await Promise.allSettled(unique.map((symbol) => getTickers([symbol])));
      const data = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
      cache.set(cacheKey, data);
      return data;
    }
    console.error('Erro ao buscar tickers na Binance:', error.message);
    throw new Error('Falha ao obter dados da Binance');
  }
};

/**
 * Busca o preço atual de um par (padrão BTCUSDT)
 */
const getSymbolPrice = async (symbol, label) => {
  const [ticker] = await getTickers([symbol]);
  if (!ticker) {
    throw new Error(`Par ${symbol} não encontrado na Binance`);
  }
  return { ...ticker, symbol: label, pair: ticker.symbol };
};

/**
 * Busca o preço atual do Bitcoin em USD
 * @returns {Promise<Object>} Dados do preço atual
 */
export const getCurrentPrice = () => getSymbolPrice('BTCUSDT', 'BTC/USD');

/**
 * Busca o preço atual do Ethereum em USD
 * @returns {Promise<Object>} Dados do preço atual do ETH
 */
export const getEthereumPrice = () => getSymbolPrice('ETHUSDT', 'ETH/USD');

/**
 * Busca histórico de preços (candles)
 * @param {string} interval - Intervalo (15m, 1h, 1d, etc)
 * @param {number} limit - Quantidade de pontos (max 1000)
 * @param {string} symbol - Par negociado (padrão BTCUSDT)
 * @returns {Promise<Array>} Array com histórico de preços
 */
export const getPriceHistory = async (interval = '1h', limit = 168, symbol = 'BTCUSDT') => {
  const cacheKey = `history_${symbol}_${interval}_${limit}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await http.get('/klines', {
      params: { symbol, interval, limit }
    });

    const data = response.data.map((candle) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));

    cache.set(cacheKey, data, HISTORY_TTL);
    return data;
  } catch (error) {
    console.error('Erro ao buscar histórico na Binance:', error.message);
    throw new Error('Falha ao obter histórico da Binance');
  }
};

/**
 * Busca dados gerais do mercado (média de variação das principais moedas)
 * @returns {Promise<Object>} Dados do mercado geral
 */
export const getMarketOverview = async () => {
  const tickers = await getTickers(MARKET_SYMBOLS);

  const averageChange =
    tickers.reduce((total, ticker) => total + ticker.change24h, 0) / (tickers.length || 1);

  return {
    change24h: averageChange,
    symbols: tickers.map((t) => t.symbol),
    timestamp: Date.now()
  };
};

/**
 * Converte período solicitado em intervalo da Binance
 * @param {number|string} days - Número de dias ou 'max'
 * @returns {Object} Configuração de intervalo e limite
 */
export const getIntervalConfig = (days) => {
  const configs = {
    1: { interval: '15m', limit: 96 },      // 24 horas, 15min cada
    7: { interval: '1h', limit: 168 },      // 7 dias, 1h cada
    30: { interval: '4h', limit: 180 },     // 30 dias, 4h cada
    90: { interval: '12h', limit: 180 },    // 90 dias, 12h cada
    365: { interval: '1d', limit: 365 },    // 1 ano, 1 dia cada
    max: { interval: '1w', limit: 1000 }    // Máximo: semanas
  };

  return configs[days] || configs[7];
};
