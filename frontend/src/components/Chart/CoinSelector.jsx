import React, { memo } from 'react';
import { useLivePrices } from '../../hooks/useLivePrices';
import { COINS, COIN_BY_SYMBOL } from '../../utils/coins';
import { formatPercentage } from '../../utils/formatters';
import CoinIcon from '../CoinIcon/CoinIcon';

/** Principais moedas exibidas como atalhos; as demais ficam no seletor "Outras" */
const MAIN_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'TRX', 'LINK', 'AVAX'];
const MAIN_COINS = MAIN_SYMBOLS.map((symbol) => COIN_BY_SYMBOL[symbol]);
const OTHER_COINS = COINS.filter((coin) => !MAIN_SYMBOLS.includes(coin.symbol));

/**
 * Filtro de moedas da Análise Técnica, com variação 24h ao vivo em cada opção
 */
const CoinSelector = ({ selectedPair, onSelect }) => {
  const prices = useLivePrices(MAIN_COINS.map((coin) => coin.pair));
  const otherSelected = OTHER_COINS.some((coin) => coin.pair === selectedPair);

  return (
    <div className="coin-selector" role="group" aria-label="Escolher moeda para análise">
      <div className="coin-chips">
        {MAIN_COINS.map((coin) => {
          const change = prices[coin.pair]?.change24h;
          const active = coin.pair === selectedPair;
          return (
            <button
              key={coin.pair}
              type="button"
              className={`coin-chip ${active ? 'active' : ''}`}
              onClick={() => onSelect(coin)}
              aria-pressed={active}
              title={coin.name}
            >
              <CoinIcon symbol={coin.symbol} size={18} />
              <span className="coin-chip-symbol">{coin.symbol}</span>
              {change != null && (
                <span className={`coin-chip-change ${change >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(change, 1)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <label className={`coin-other ${otherSelected ? 'active' : ''}`}>
        <span className="sr-only">Outras moedas</span>
        <select
          value={otherSelected ? selectedPair : ''}
          onChange={(e) => {
            const coin = OTHER_COINS.find((c) => c.pair === e.target.value);
            if (coin) onSelect(coin);
          }}
        >
          <option value="" disabled>
            Outras moedas
          </option>
          {OTHER_COINS.map((coin) => (
            <option key={coin.pair} value={coin.pair}>
              {coin.name} ({coin.symbol})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default memo(CoinSelector);
