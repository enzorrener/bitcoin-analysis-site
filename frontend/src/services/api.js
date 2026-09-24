/**
 * Camada de dados do frontend.
 *
 * Modo "backend" (padrão): consulta a API Node/Express em /api. Se o backend
 * estiver fora do ar, cai automaticamente para as APIs públicas.
 * Modo "static" (VITE_DATA_MODE=static, usado no GitHub Pages): consulta direto
 * Binance, CoinGecko e alternative.me pelo navegador; as notícias vêm do
 * arquivo data/news.json gerado pela rotina agendada.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const isStaticMode = import.meta.env.VITE_DATA_MODE === 'static';

const BINANCE_API = 'https://api.binance.com/api/v3';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const FEAR_GREED_API = 'https://api.alternative.me/fng/';
const STATIC_NEWS_URL = `${import.meta.env.BASE_URL}data/news.json`;

const FEAR_GREED_LABELS = {
  'Extreme Fear': 'Medo extremo',
  Fear: 'Medo',
  Neutral: 'Neutro',
  Greed: 'Ganância',
  'Extreme Greed': 'Ganância extrema'
};

// ===== HTTP =====

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * fetch com timeout e parse de JSON
 */
export const fetchJson = async (url, { timeout = 10000, ...options } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new ApiError(body?.message || `Erro ${response.status}`, response.status, body);
    }
    if (!isJson) {
      throw new ApiError('Resposta inválida do servidor', response.status);
    }
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('Tempo de resposta esgotado', 0);
    if (error instanceof ApiError) throw error;
    throw new ApiError('Falha de conexão', 0);
  } finally {
    clearTimeout(timer);
  }
};

// ===== Backend com fallback =====

let backendDownUntil = 0;

const backendAvailable = () => !isStaticMode && Date.now() > backendDownUntil;

/**
 * Chamada ao backend (retorna o campo data do envelope { success, data })
 */
export const backendRequest = async (path, options = {}) => {
  const body = await fetchJson(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  return body.data;
};

/**
 * Tenta o backend e, se ele não responder, usa a fonte pública direta
 */
const withFallback = async (path, direct, options) => {
  if (backendAvailable()) {
    try {
      return await backendRequest(path, options);
    } catch (error) {
      // Backend fora do ar (ou inexistente): evita novas tentativas por 1 minuto
      if (error.status === 0 || error.status === 404 || error.status >= 500) {
        if (error.status === 0 || error.status === 404) backendDownUntil = Date.now() + 60000;
      } else {
        throw error;
      }
    }
  }
  return direct();
};

// ===== Cache em memória (evita requisições duplicadas entre componentes) =====

const memoryCache = new Map();

const cached = (key, ttl, fn) => {
  const entry = memoryCache.get(key);
  if (entry && (entry.promise || Date.now() - entry.time < ttl)) {
    return entry.promise || Promise.resolve(entry.value);
  }

  const promise = fn()
    .then((value) => {
      memoryCache.set(key, { value, time: Date.now() });
      return value;
    })
    .catch((error) => {
      // Se já existe um valor anterior, mantém o dado antigo em vez de exibir erro
      if (entry?.value !== undefined) {
        memoryCache.set(key, { value: entry.value, time: entry.time });
        return entry.value;
      }
      memoryCache.delete(key);
      throw error;
    });

  memoryCache.set(key, { ...entry, promise });
  return promise;
};

// ===== Normalizadores (mesmo formato do backend) =====

const normalizeTicker = (ticker) => {
  const base = ticker.symbol.replace(/(USDT|BRL|USDC|FDUSD)$/, '');
  return {
    symbol: ticker.symbol,
    base,
    quote: ticker.symbol.slice(base.length),
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

const INTERVALS = {
  1: { interval: '15m', limit: 96 },
  7: { interval: '1h', limit: 168 },
  30: { interval: '4h', limit: 180 },
  90: { interval: '12h', limit: 180 },
  365: { interval: '1d', limit: 365 },
  max: { interval: '1w', limit: 1000 }
};

// ===== Fontes públicas (modo estático / fallback) =====

const directTickers = async (symbols) => {
  try {
    const data = await fetchJson(`${BINANCE_API}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
    return data.map(normalizeTicker);
  } catch (error) {
    // Um par inexistente invalida o lote: tenta um a um
    if (error.status === 400 && symbols.length > 1) {
      const results = await Promise.allSettled(symbols.map((s) => directTickers([s])));
      return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    }
    throw error;
  }
};

const directHistory = async (period, symbol) => {
  const { interval, limit } = INTERVALS[period] || INTERVALS[7];
  const data = await fetchJson(`${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  return data.map((candle) => ({
    timestamp: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
};

const directGlobal = async () => {
  const { data } = await fetchJson(`${COINGECKO_API}/global`);
  return {
    totalMarketCap: data.total_market_cap.usd,
    totalVolume: data.total_volume.usd,
    btcDominance: data.market_cap_percentage.btc,
    ethDominance: data.market_cap_percentage.eth,
    marketCapChange24h: data.market_cap_change_percentage_24h_usd,
    activeCryptocurrencies: data.active_cryptocurrencies,
    updatedAt: data.updated_at * 1000
  };
};

const directFearGreed = async () => {
  const { data } = await fetchJson(`${FEAR_GREED_API}?limit=30`);
  const history = data.map((item) => ({
    value: Number(item.value),
    classification: FEAR_GREED_LABELS[item.value_classification] || item.value_classification,
    timestamp: Number(item.timestamp) * 1000
  }));
  return { ...history[0], history };
};

const directCoins = async () => {
  const data = await fetchJson(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`
  );
  return data.map(normalizeCoin);
};

const directSearch = async (query) => {
  const { coins } = await fetchJson(`${COINGECKO_API}/search?query=${encodeURIComponent(query)}`);
  const top = coins.slice(0, 10);
  if (top.length === 0) return [];

  const prices = await fetchJson(
    `${COINGECKO_API}/simple/price?ids=${top.map((c) => c.id).join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  );

  return top.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.large || coin.thumb,
    rank: coin.market_cap_rank,
    price: prices[coin.id]?.usd ?? null,
    change24h: prices[coin.id]?.usd_24h_change ?? null,
    marketCap: prices[coin.id]?.usd_market_cap ?? null
  }));
};

// ===== API pública do módulo =====

/**
 * Cotação 24h de vários pares da Binance (ex: ['BTCUSDT', 'ETHUSDT'])
 */
export const getTickers = (symbols) => {
  const list = [...new Set(symbols)].sort();
  return cached(`tickers:${list.join(',')}`, 10000, () =>
    withFallback(`/market/tickers?symbols=${list.join(',')}`, () => directTickers(list))
  );
};

/**
 * Serviço: Buscar preço atual do Bitcoin
 */
export const getCurrentPrice = async () => (await getTickers(['BTCUSDT']))[0];

/**
 * Serviço: Buscar preço atual do Ethereum
 */
export const getEthereumPrice = async () => (await getTickers(['ETHUSDT']))[0];

/**
 * Serviço: Buscar histórico de preços
 * @param {string} period - Período: 1, 7, 30, 90, 365, max
 * @param {string} symbol - Par da Binance (padrão BTCUSDT)
 */
export const getPriceHistory = (period = '7', symbol = 'BTCUSDT') =>
  cached(`history:${symbol}:${period}`, 60000, () =>
    withFallback(`/bitcoin/history?period=${period}&symbol=${symbol}`, () => directHistory(period, symbol))
  );

const CHART_DAYS = { 1: 1, 7: 7, 30: 30, 90: 90, 365: 365, max: 'max' };

const directCoinChart = async (id, period) => {
  const days = CHART_DAYS[period] || 7;
  const { prices } = await fetchJson(`${COINGECKO_API}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`);
  return prices.map(([timestamp, price]) => ({ timestamp, open: price, high: price, low: price, close: price }));
};

/**
 * Serviço: Histórico pela CoinGecko (moedas sem par na Binance)
 * @param {string} id - Identificador da moeda na CoinGecko
 */
export const getCoinChart = (id, period = '7') =>
  cached(`coin-chart:${id}:${period}`, 300000, () =>
    withFallback(`/market/chart/${encodeURIComponent(id)}?period=${period}`, () => directCoinChart(id, period))
  );

/**
 * Serviço: Dados globais (capitalização total, volume, dominância)
 */
export const getGlobalMarket = () =>
  cached('global', 120000, () => withFallback('/market/global', directGlobal));

/**
 * Serviço: Índice de Medo & Ganância
 */
export const getFearGreed = () =>
  cached('fear-greed', 600000, () => withFallback('/market/fear-greed', directFearGreed));

/**
 * Serviço: Top 100 criptomoedas por capitalização
 */
export const getCoinsMarkets = () =>
  cached('coins', 120000, () => withFallback('/market/coins', directCoins));

/**
 * Serviço: Buscar criptomoedas por nome ou símbolo
 */
export const searchCoins = (query) => {
  const term = query.trim().toLowerCase();
  return cached(`search:${term}`, 300000, () =>
    withFallback(`/market/search?q=${encodeURIComponent(term)}`, () => directSearch(term))
  );
};

/**
 * Serviço: Buscar dados gerais do mercado (média das principais moedas)
 */
export const getMarketOverview = async () => {
  const tickers = await getTickers(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']);
  const change24h = tickers.reduce((total, t) => total + t.change24h, 0) / (tickers.length || 1);
  return { change24h, timestamp: Date.now() };
};

/**
 * Serviço: Estatísticas consolidadas do mercado
 */
export const getMarketStats = async () => {
  const [price, fearGreed, global] = await Promise.allSettled([
    getCurrentPrice(),
    getFearGreed(),
    getGlobalMarket()
  ]);

  if (price.status === 'rejected') throw price.reason;

  return {
    currentPrice: price.value.price,
    change24h: price.value.change24h,
    high24h: price.value.high24h,
    low24h: price.value.low24h,
    volume24h: price.value.volume24h,
    fearGreed: fearGreed.status === 'fulfilled' ? fearGreed.value : null,
    btcDominance: global.status === 'fulfilled' ? global.value.btcDominance : null,
    totalMarketCap: global.status === 'fulfilled' ? global.value.totalMarketCap : null
  };
};

/**
 * Serviço: Notícias relevantes (atualizadas às 09:00 e 18:00, horário de Brasília)
 * @param {boolean} force - Ignora o cache (usado quando passa do horário de atualização)
 */
export const getNews = (force = false) => {
  if (force) memoryCache.delete('news');
  return cached('news', 300000, () =>
    // A primeira coleta no servidor pode levar alguns segundos
    withFallback('/news', () => fetchJson(`${STATIC_NEWS_URL}?t=${Math.floor(Date.now() / 300000)}`), { timeout: 30000 })
  );
};

export default {
  getTickers,
  getCurrentPrice,
  getEthereumPrice,
  getPriceHistory,
  getCoinChart,
  getGlobalMarket,
  getFearGreed,
  getCoinsMarkets,
  searchCoins,
  getMarketOverview,
  getMarketStats,
  getNews
};
