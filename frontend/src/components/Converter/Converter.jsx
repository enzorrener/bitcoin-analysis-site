import React, { useMemo, useState } from 'react';
import { useLivePrices } from '../../hooks/useLivePrices';
import { COINS, USD_BRL_PAIR } from '../../utils/coins';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { SwapIcon } from '../Icons/Icons';
import './Converter.css';

const parseAmount = (text) => {
  const clean = String(text).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const value = parseFloat(clean);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

/**
 * Conversor entre criptomoedas, dólar e real com cotação ao vivo
 */
const Converter = ({ defaultPair = 'BTCUSDT' }) => {
  const [pair, setPair] = useState(defaultPair);
  const [amount, setAmount] = useState('1');
  const [fiat, setFiat] = useState('BRL');
  const [mode, setMode] = useState('crypto'); // crypto -> fiat | fiat -> crypto
  const prices = useLivePrices([pair, USD_BRL_PAIR]);

  const coin = COINS.find((c) => c.pair === pair);
  const usdPrice = prices[pair]?.price;
  const brlRate = prices[USD_BRL_PAIR]?.price;
  const fiatPrice = fiat === 'USD' ? usdPrice : usdPrice && brlRate ? usdPrice * brlRate : null;

  const result = useMemo(() => {
    const value = parseAmount(amount);
    if (!fiatPrice) return null;
    return mode === 'crypto' ? value * fiatPrice : value / fiatPrice;
  }, [amount, fiatPrice, mode]);

  const fiatSelect = (
    <select value={fiat} onChange={(e) => setFiat(e.target.value)} aria-label="Moeda fiduciária">
      <option value="BRL">BRL</option>
      <option value="USD">USD</option>
    </select>
  );

  const coinSelect = (
    <select value={pair} onChange={(e) => setPair(e.target.value)} aria-label="Criptomoeda">
      {COINS.map((c) => (
        <option key={c.pair} value={c.pair}>{c.symbol}</option>
      ))}
    </select>
  );

  return (
    <div className="side-card converter">
      <div className="side-card-head">
        <h3>Conversor</h3>
        <span className="side-card-hint">Cotação ao vivo</span>
      </div>

      <div className="converter-row">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Valor"
          className="num"
        />
        {mode === 'crypto' ? coinSelect : fiatSelect}
      </div>

      <button
        type="button"
        className="converter-swap"
        onClick={() => setMode((m) => (m === 'crypto' ? 'fiat' : 'crypto'))}
        aria-label="Inverter conversão"
      >
        <SwapIcon size={16} />
      </button>

      <div className="converter-row result">
        <output className="num" aria-live="polite">
          {result == null
            ? '—'
            : mode === 'crypto'
              ? formatCurrency(result, fiat)
              : `${formatNumber(result, result < 1 ? 8 : 4)}`}
        </output>
        {mode === 'crypto' ? fiatSelect : coinSelect}
      </div>

      <p className="converter-note num">
        1 {coin?.symbol} = {fiatPrice ? formatCurrency(fiatPrice, fiat) : '—'}
        {fiat === 'BRL' && brlRate && <> • US$ 1 = {formatCurrency(brlRate, 'BRL')}</>}
      </p>
    </div>
  );
};

export default Converter;
