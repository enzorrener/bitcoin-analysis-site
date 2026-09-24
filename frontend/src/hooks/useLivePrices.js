import { useEffect, useRef, useSyncExternalStore } from 'react';
import { addListener, getPrice, getStatus, getVersion, subscribeSymbols } from '../services/liveTicker';

/**
 * Preços em tempo real de vários pares. Só re-renderiza quando algum deles muda.
 * @param {string[]} symbols - Ex: ['BTCUSDT', 'ETHUSDT']
 */
export const useLivePrices = (symbols) => {
  const key = symbols.join(',');
  const cacheRef = useRef({ versionKey: null, value: {} });

  useEffect(() => {
    if (!key) return undefined;
    return subscribeSymbols(key.split(','));
  }, [key]);

  const getSnapshot = () => {
    const versionKey = `${key}|${symbols.map(getVersion).join(',')}`;
    if (cacheRef.current.versionKey !== versionKey) {
      const value = {};
      symbols.forEach((symbol) => {
        const price = getPrice(symbol);
        if (price) value[symbol] = price;
      });
      cacheRef.current = { versionKey, value };
    }
    return cacheRef.current.value;
  };

  return useSyncExternalStore(addListener, getSnapshot);
};

/**
 * Preço em tempo real de um único par
 */
export const useLivePrice = (symbol) => useLivePrices(symbol ? [symbol] : [])[symbol];

/**
 * Estado da conexão: live | polling | paused | idle
 */
export const useLiveStatus = () => useSyncExternalStore(addListener, getStatus);
