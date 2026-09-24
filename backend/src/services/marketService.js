import axios from 'axios';
import NodeCache from 'node-cache';

const COINGECKO_API = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

const cache = new NodeCache({ stdTTL: 120 });

const coingecko = axios.create({
  baseURL: COINGECKO_API,
  timeout: 10000,
  headers: process.env.COINGECKO_API_KEY
    ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
    : {}
});

// Tradução das classificações do Índice de Medo & Ganância
const FEAR_GREED_LABELS = {
  'Extreme Fear': 'Medo extremo',
  Fear: 'Medo',
  Neutral: 'Neutro',
  Greed: 'Ganância',
  'Extreme Greed': 'Ganância extrema'
};

/**
 * Executa a função apenas se o valor não estiver em cache
 */
const cached = async (key, ttl, fn) => {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cache.set(key, value, ttl);
  return value;
};

/**
 * Dados globais do mercado cripto (capitalização, volume e dominância)
 */
export const getGlobalMarket = () =>
  cached('global', 300, async () => {
    const { data } = await coingecko.get('/global');
    const global = data.data;

    return {
      totalMarketCap: global.total_market_cap.usd,
      totalVolume: global.total_volume.usd,
      btcDominance: global.market_cap_percentage.btc,
      ethDominance: global.market_cap_percentage.eth,
      marketCapChange24h: global.market_cap_change_percentage_24h_usd,
      activeCryptocurrencies: global.active_cryptocurrencies,
      updatedAt: global.updated_at * 1000
    };
  });

/**
 * Índice de Medo & Ganância (alternative.me)
 * @param {number} limit - Quantidade de dias de histórico
 */
export const getFearGreed = (limit = 30) =>
  cached(`fng_${limit}`, 1800, async () => {
    const { data } = await axios.get(FEAR_GREED_API, { params: { limit }, timeout: 10000 });

    const history = data.data.map((item) => ({
      value: Number(item.value),
      classification: FEAR_GREED_LABELS[item.value_classification] || item.value_classification,
      timestamp: Number(item.timestamp) * 1000
    }));

    return {
      ...history[0],
      history
    };
  });

/**
 * Normaliza uma moeda retornada por /coins/markets
 */
const normalizeCoin = (coin) => ({
  id: coin.id,
  symbol: coin.symbol.toUpperCase(),
  name: coin.name,
  image: coin.image,
  rank: coin.market_cap_rank,
  price: coin.current_price,
  change24h: coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h,
  change7d: coin.price_change_percentage_7d_in_currency ?? null,
  marketCap: coin.market_cap,
  volume24h: coin.total_volume,
  high24h: coin.high_24h,
  low24h: coin.low_24h,
  ath: coin.ath,
  athChange: coin.ath_change_percentage,
  sparkline: coin.sparkline_in_7d?.price || []
});

/**
 * Lista das maiores criptomoedas por capitalização
 * @param {number} perPage - Quantidade de moedas (max 250)
 */
export const getCoinsMarkets = (perPage = 100) =>
  cached(`markets_${perPage}`, 120, async () => {
    const { data } = await coingecko.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: perPage,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h,7d'
      }
    });
    return data.map(normalizeCoin);
  });

/**
 * Busca moedas por nome ou símbolo e retorna o preço atual de cada uma
 * @param {string} query - Texto de busca
 */
export const searchCoins = (query) => {
  const term = query.trim().toLowerCase();

  return cached(`search_${term}`, 300, async () => {
    const { data } = await coingecko.get('/search', { params: { query: term } });
    const coins = data.coins.slice(0, 10);
    if (coins.length === 0) return [];

    const ids = coins.map((coin) => coin.id).join(',');
    const { data: prices } = await coingecko.get('/simple/price', {
      params: {
        ids,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true
      }
    });

    return coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.large || coin.thumb,
      rank: coin.market_cap_rank,
      price: prices[coin.id]?.usd ?? null,
      change24h: prices[coin.id]?.usd_24h_change ?? null,
      marketCap: prices[coin.id]?.usd_market_cap ?? null
    }));
  });
};

const CHART_DAYS = { 1: 1, 7: 7, 30: 30, 90: 90, 365: 365, max: 'max' };

/**
 * Histórico de preços pela CoinGecko (para moedas sem par na Binance)
 * @param {string} id - Identificador da moeda na CoinGecko
 * @param {string} period - 1, 7, 30, 90, 365 ou max
 */
export const getMarketChart = (id, period = '7') => {
  const days = CHART_DAYS[period] || 7;

  return cached(`chart_${id}_${days}`, 300, async () => {
    const { data } = await coingecko.get(`/coins/${encodeURIComponent(id)}/market_chart`, {
      params: { vs_currency: 'usd', days }
    });
    return data.prices.map(([timestamp, price]) => ({
      timestamp,
      open: price,
      high: price,
      low: price,
      close: price
    }));
  });
};
