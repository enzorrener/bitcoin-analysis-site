/**
 * Preços em tempo real.
 *
 * Uma única conexão WebSocket com a Binance (stream miniTicker) é compartilhada
 * por todos os componentes. Se o WebSocket falhar, usa consulta periódica (REST).
 * Quando a aba fica oculta a conexão é pausada para economizar rede e bateria.
 */
import { getTickers } from './api';

const WS_URL = 'wss://stream.binance.com:9443/stream?streams=';
const POLL_INTERVAL = 15000;
const MAX_WS_FAILURES = 3;
const FLUSH_INTERVAL = 800;

const prices = new Map();       // símbolo -> ticker
const versions = new Map();     // símbolo -> contador de atualizações
const refCounts = new Map();    // símbolo -> quantidade de assinantes
const listeners = new Set();

let socket = null;
let socketSymbols = '';
let wsFailures = 0;
let pollTimer = null;
let reconnectTimer = null;
let syncTimer = null;
let flushTimer = null;
let pendingNotify = false;
let status = 'idle';            // idle | live | polling | paused

const notify = () => {
  if (pendingNotify) return;
  pendingNotify = true;
  flushTimer = setTimeout(() => {
    pendingNotify = false;
    listeners.forEach((listener) => listener());
  }, FLUSH_INTERVAL);
};

const setStatus = (next) => {
  if (status !== next) {
    status = next;
    notify();
  }
};

const update = (ticker) => {
  const previous = prices.get(ticker.symbol);
  if (previous && previous.price === ticker.price && previous.timestamp >= ticker.timestamp) return;
  prices.set(ticker.symbol, { ...previous, ...ticker, previousPrice: previous?.price ?? ticker.price });
  versions.set(ticker.symbol, (versions.get(ticker.symbol) || 0) + 1);
  notify();
};

const activeSymbols = () => [...refCounts.keys()].sort();

const fetchSnapshot = async (symbols = activeSymbols()) => {
  if (symbols.length === 0) return;
  try {
    const tickers = await getTickers(symbols);
    tickers.forEach(update);
  } catch {
    // Mantém os últimos valores conhecidos
  }
};

const stopPolling = () => {
  clearInterval(pollTimer);
  pollTimer = null;
};

const startPolling = () => {
  closeSocket();
  if (pollTimer) return;
  setStatus('polling');
  pollTimer = setInterval(() => fetchSnapshot(), POLL_INTERVAL);
};

function closeSocket() {
  clearTimeout(reconnectTimer);
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    socket.close();
    socket = null;
    socketSymbols = '';
  }
}

const handleMessage = (event) => {
  try {
    const { data } = JSON.parse(event.data);
    if (!data || data.e !== '24hrMiniTicker') return;
    const price = parseFloat(data.c);
    const open = parseFloat(data.o);
    const current = prices.get(data.s);

    update({
      ...current,
      symbol: data.s,
      price,
      open24h: open,
      change24h: open ? ((price - open) / open) * 100 : 0,
      changeAbs24h: price - open,
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      quoteVolume24h: parseFloat(data.q),
      timestamp: data.E
    });
  } catch {
    // Mensagem inválida: ignora
  }
};

const openSocket = () => {
  const symbols = activeSymbols();
  const key = symbols.join(',');

  if (symbols.length === 0) {
    closeSocket();
    stopPolling();
    setStatus('idle');
    return;
  }
  if (socket && socketSymbols === key) return;
  if (typeof WebSocket === 'undefined' || wsFailures >= MAX_WS_FAILURES) {
    startPolling();
    return;
  }

  closeSocket();
  const streams = symbols.map((s) => `${s.toLowerCase()}@miniTicker`).join('/');
  const ws = new WebSocket(`${WS_URL}${streams}`);
  socket = ws;
  socketSymbols = key;

  ws.onopen = () => {
    wsFailures = 0;
    stopPolling();
    setStatus('live');
  };
  ws.onmessage = handleMessage;
  ws.onerror = () => ws.close();
  ws.onclose = () => {
    if (socket !== ws) return;
    socket = null;
    socketSymbols = '';
    wsFailures += 1;
    if (wsFailures >= MAX_WS_FAILURES) {
      startPolling();
    } else {
      setStatus('polling');
      fetchSnapshot();
      reconnectTimer = setTimeout(openSocket, 2000 * wsFailures);
    }
  };
};

/**
 * Reagrupa as assinaturas (várias mudanças seguidas geram uma única reconexão)
 */
const scheduleSync = () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (pollTimer) {
      fetchSnapshot();
      return;
    }
    openSocket();
  }, 250);
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      closeSocket();
      stopPolling();
      setStatus('paused');
    } else if (refCounts.size > 0) {
      fetchSnapshot();
      if (wsFailures >= MAX_WS_FAILURES) startPolling();
      else openSocket();
    }
  });
}

/**
 * Assina atualizações de preço dos símbolos informados
 * @returns {Function} Função para cancelar a assinatura
 */
export const subscribeSymbols = (symbols) => {
  const newSymbols = [];
  symbols.forEach((symbol) => {
    const count = refCounts.get(symbol) || 0;
    if (count === 0) newSymbols.push(symbol);
    refCounts.set(symbol, count + 1);
  });

  if (newSymbols.length > 0) {
    fetchSnapshot(newSymbols.filter((s) => !prices.has(s)));
    scheduleSync();
  }

  return () => {
    symbols.forEach((symbol) => {
      const count = (refCounts.get(symbol) || 1) - 1;
      if (count <= 0) refCounts.delete(symbol);
      else refCounts.set(symbol, count);
    });
    scheduleSync();
  };
};

export const addListener = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPrice = (symbol) => prices.get(symbol);

export const getVersion = (symbol) => versions.get(symbol) || 0;

export const getStatus = () => status;

/**
 * Para testes: limpa timers pendentes
 */
export const _reset = () => {
  closeSocket();
  stopPolling();
  clearTimeout(flushTimer);
  clearTimeout(syncTimer);
};
