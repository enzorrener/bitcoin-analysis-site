/**
 * Principais criptomoedas com par em USDT na Binance.
 * id = identificador na CoinGecko (usado para logo, capitalização e busca).
 */
export const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
  { symbol: 'XRP', name: 'XRP', id: 'ripple' },
  { symbol: 'BNB', name: 'BNB', id: 'binancecoin' },
  { symbol: 'SOL', name: 'Solana', id: 'solana' },
  { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
  { symbol: 'ADA', name: 'Cardano', id: 'cardano' },
  { symbol: 'TRX', name: 'TRON', id: 'tron' },
  { symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
  { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
  { symbol: 'XLM', name: 'Stellar', id: 'stellar' },
  { symbol: 'SUI', name: 'Sui', id: 'sui' },
  { symbol: 'TON', name: 'Toncoin', id: 'the-open-network' },
  { symbol: 'HBAR', name: 'Hedera', id: 'hedera-hashgraph' },
  { symbol: 'BCH', name: 'Bitcoin Cash', id: 'bitcoin-cash' },
  { symbol: 'LTC', name: 'Litecoin', id: 'litecoin' },
  { symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
  { symbol: 'SHIB', name: 'Shiba Inu', id: 'shiba-inu' },
  { symbol: 'UNI', name: 'Uniswap', id: 'uniswap' },
  { symbol: 'NEAR', name: 'NEAR Protocol', id: 'near' },
  { symbol: 'APT', name: 'Aptos', id: 'aptos' },
  { symbol: 'PEPE', name: 'Pepe', id: 'pepe' },
  { symbol: 'ICP', name: 'Internet Computer', id: 'internet-computer' },
  { symbol: 'ETC', name: 'Ethereum Classic', id: 'ethereum-classic' },
  { symbol: 'AAVE', name: 'Aave', id: 'aave' },
  { symbol: 'POL', name: 'Polygon', id: 'polygon-ecosystem-token' },
  { symbol: 'ARB', name: 'Arbitrum', id: 'arbitrum' },
  { symbol: 'OP', name: 'Optimism', id: 'optimism' },
  { symbol: 'ATOM', name: 'Cosmos', id: 'cosmos' },
  { symbol: 'FIL', name: 'Filecoin', id: 'filecoin' }
].map((coin, index) => ({ ...coin, pair: `${coin.symbol}USDT`, order: index + 1 }));

export const COIN_BY_PAIR = Object.fromEntries(COINS.map((coin) => [coin.pair, coin]));
export const COIN_BY_SYMBOL = Object.fromEntries(COINS.map((coin) => [coin.symbol, coin]));

/** Moedas exibidas na faixa de cotações do topo */
export const TICKER_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'DOGEUSDT', 'ADAUSDT', 'LINKUSDT'];

/** Moedas usadas para o "humor" geral do mercado */
export const MARKET_PAIRS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

/** Par usado para converter dólar em real */
export const USD_BRL_PAIR = 'USDTBRL';

/** Lista inicial da watchlist de um novo usuário */
export const DEFAULT_WATCHLIST = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'];

/**
 * Ícone da moeda (repositório público de ícones via jsDelivr)
 */
export const coinIconUrl = (symbol) =>
  `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${symbol.toLowerCase()}.svg`;
