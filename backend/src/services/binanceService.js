import axios from 'axios';
import NodeCache from 'node-cache';

const BINANCE_API = 'https://api.binance.com/api/v3';

// Cache para reduzir chamadas à API (TTL de 30 segundos)
const cache = new NodeCache({ stdTTL: 30 });

/**
 * Busca o preço atual do Bitcoin em USD
 * @returns {Promise<Object>} Dados do preço atual
 */
export const getCurrentPrice = async () => {
  const cacheKey = 'btc_current_price';

  // Verificar cache primeiro
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      params: { symbol: 'BTCUSDT' }
    });

    const data = {
      symbol: 'BTC/USD',
      price: parseFloat(response.data.lastPrice),
      change24h: parseFloat(response.data.priceChangePercent),
      high24h: parseFloat(response.data.highPrice),
      low24h: parseFloat(response.data.lowPrice),
      volume24h: parseFloat(response.data.volume),
      timestamp: Date.now()
    };

    // Armazenar no cache
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar preço na Binance:', error.message);
    throw new Error('Falha ao obter dados da Binance');
  }
};

/**
 * Busca histórico de preços do Bitcoin
 * @param {string} interval - Intervalo (1m, 5m, 1h, 1d, etc)
 * @param {number} limit - Quantidade de pontos (max 1000)
 * @returns {Promise<Array>} Array com histórico de preços
 */
export const getPriceHistory = async (interval = '1h', limit = 168) => {
  const cacheKey = `btc_history_${interval}_${limit}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${BINANCE_API}/klines`, {
      params: {
        symbol: 'BTCUSDT',
        interval: interval,
        limit: limit
      }
    });

    const data = response.data.map(candle => ({
      timestamp: candle[0],
      date: new Date(candle[0]).toISOString(),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));

    // Cache de 5 minutos para histórico
    cache.set(cacheKey, data, 300);
    return data;
  } catch (error) {
    console.error('Erro ao buscar histórico na Binance:', error.message);
    throw new Error('Falha ao obter histórico da Binance');
  }
};

/**
 * Busca o preço atual do Ethereum em USD
 * @returns {Promise<Object>} Dados do preço atual do ETH
 */
export const getEthereumPrice = async () => {
  const cacheKey = 'eth_current_price';

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      params: { symbol: 'ETHUSDT' }
    });

    const data = {
      symbol: 'ETH/USD',
      price: parseFloat(response.data.lastPrice),
      change24h: parseFloat(response.data.priceChangePercent),
      high24h: parseFloat(response.data.highPrice),
      low24h: parseFloat(response.data.lowPrice),
      volume24h: parseFloat(response.data.volume),
      timestamp: Date.now()
    };

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar preço do ETH na Binance:', error.message);
    throw new Error('Falha ao obter dados do ETH da Binance');
  }
};

/**
 * Busca dados gerais do mercado (média de mudança)
 * @returns {Promise<Object>} Dados do mercado geral
 */
export const getMarketOverview = async () => {
  const cacheKey = 'market_overview';

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Buscar top 10 moedas para calcular média do mercado
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

    const requests = symbols.map(symbol =>
      axios.get(`${BINANCE_API}/ticker/24hr`, { params: { symbol } })
    );

    const responses = await Promise.all(requests);

    // Calcular média de mudança ponderada
    let totalChange = 0;
    responses.forEach(response => {
      totalChange += parseFloat(response.data.priceChangePercent);
    });

    const averageChange = totalChange / responses.length;

    const data = {
      change24h: averageChange,
      timestamp: Date.now()
    };

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do mercado:', error.message);
    throw new Error('Falha ao obter dados gerais do mercado');
  }
};

/**
 * Converte período solicitado em intervalo da Binance
 * @param {number} days - Número de dias
 * @returns {Object} Configuração de intervalo e limite
 */
export const getIntervalConfig = (days) => {
  const configs = {
    7: { interval: '1h', limit: 168 },      // 7 dias, 1h cada
    30: { interval: '4h', limit: 180 },     // 30 dias, 4h cada
    90: { interval: '12h', limit: 180 },    // 90 dias, 12h cada
    365: { interval: '1d', limit: 365 },    // 1 ano, 1 dia cada
    max: { interval: '1w', limit: 500 }     // Máximo: semanas
  };

  return configs[days] || configs[7];
};
