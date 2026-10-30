import { useMemo } from 'react';
import { useAsync } from './useAsync';
import { useLivePrice } from './useLivePrices';
import { getFearGreed, getGlobalMarket, getPriceHistory } from '../services/api';
import { analyzeMarket, buildSignal } from '../utils/indicators';

/**
 * Análise técnica com dados reais (candles diários de 1 ano + preço ao vivo).
 * Padrão: Bitcoin. As requisições são compartilhadas entre os componentes pelo cache da API.
 * @param {string} pair - Par da Binance (ex: ETHUSDT)
 */
export const useMarketAnalysis = (pair = 'BTCUSDT') => {
  const daily = useAsync(() => getPriceHistory('365', pair), [pair], { refreshInterval: 10 * 60 * 1000 });
  const fearGreed = useAsync(getFearGreed, [], { refreshInterval: 30 * 60 * 1000 });
  const global = useAsync(getGlobalMarket, [], { refreshInterval: 5 * 60 * 1000 });
  const live = useLivePrice(pair);

  // Arredonda o preço ao vivo (5 dígitos significativos) para não recalcular a cada centavo;
  // funciona tanto para o BTC quanto para moedas abaixo de US$ 1
  const livePrice = live ? Number(live.price.toPrecision(5)) : null;
  // Evita misturar candles da moeda anterior com o preço da nova enquanto carrega
  const candles = daily.loading ? null : daily.data;

  const analysis = useMemo(() => analyzeMarket(candles, livePrice), [candles, livePrice]);
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
