import React, { memo } from 'react';
import { useLivePrices, useLiveStatus } from '../../hooks/useLivePrices';
import { COIN_BY_PAIR, MARKET_PAIRS, TICKER_PAIRS } from '../../utils/coins';
import { formatPercentage } from '../../utils/formatters';
import LivePrice from '../LivePrice/LivePrice';
import CoinIcon from '../CoinIcon/CoinIcon';
import './TickerBar.css';

const ALL_PAIRS = [...new Set([...TICKER_PAIRS, ...MARKET_PAIRS])];

const STATUS_LABEL = {
  live: 'Ao vivo',
  polling: 'Atualizando',
  paused: 'Pausado',
  idle: 'Conectando'
};

/**
 * Faixa de cotações em tempo real exibida abaixo do menu
 */
const TickerBar = () => {
  const prices = useLivePrices(ALL_PAIRS);
  const status = useLiveStatus();

  const marketTickers = MARKET_PAIRS.map((pair) => prices[pair]).filter(Boolean);
  const marketChange = marketTickers.length
    ? marketTickers.reduce((sum, t) => sum + t.change24h, 0) / marketTickers.length
    : null;

  return (
    <div className="ticker-bar" aria-label="Cotações em tempo real">
      <div className="container ticker-bar-inner">
        <span className={`live-status ${status}`} title="Dados da Binance">
          <span className="live-dot" />
          {STATUS_LABEL[status] || 'Conectando'}
        </span>

        <div className="ticker-scroll">
          {TICKER_PAIRS.map((pair) => {
            const ticker = prices[pair];
            const coin = COIN_BY_PAIR[pair];
            return (
              <div className="ticker-item" key={pair}>
                <CoinIcon symbol={coin.symbol} size={16} />
                <span className="ticker-symbol">{coin.symbol}</span>
                <LivePrice value={ticker?.price} previous={ticker?.previousPrice} className="ticker-price" />
                {ticker && (
                  <span className={`ticker-change ${ticker.change24h >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(ticker.change24h)}
                  </span>
                )}
              </div>
            );
          })}

          <div className="ticker-item ticker-market">
            <span className="ticker-symbol">Mercado</span>
            {marketChange != null ? (
              <span className={`ticker-change ${marketChange >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(marketChange)}
              </span>
            ) : (
              <span className="skeleton">0,00%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TickerBar);
