import { useMemo } from 'react';
import { useAsync } from './useAsync';
import { useLivePrice } from './useLivePrices';
import { getFearGreed, getGlobalMarket, getPriceHistory } from '../services/api';
import { analyzeMarket, buildSignal } from '../utils/indicators';

/**
 * Análise técnica do Bitcoin com dados reais (candles diários de 1 ano + preço ao vivo).
 * As requisições são compartilhadas entre os componentes pelo cache da camada de API.
 */
export const useMarketAnalysis = () => {
  const daily = useAsync(() => getPriceHistory('365', 'BTCUSDT'), [], { refreshInterval: 10 * 60 * 1000 });
  const fearGreed = useAsync(getFearGreed, [], { refreshInterval: 30 * 60 * 1000 });
  const global = useAsync(getGlobalMarket, [], { refreshInterval: 5 * 60 * 1000 });
  const live = useLivePrice('BTCUSDT');

  // Arredonda o preço ao vivo para não recalcular a cada centavo
  const livePrice = live ? Math.round(live.price) : null;

  const analysis = useMemo(() => analyzeMarket(daily.data, livePrice), [daily.data, livePrice]);
  const signal = useMemo(() => buildSignal(analysis, fearGreed.data), [analysis, fearGreed.data]);

  return {
    analysis,
    signal,
    live,
    fearGreed: fearGreed.data,
    global: global.data,
    loading: daily.loading && !daily.data,
    error: daily.error && !daily.data ? daily.error : null
  };
};
