import React, { memo, useState } from 'react';
import { coinIconUrl } from '../../utils/coins';
import './CoinIcon.css';

const COLORS = ['#f7931a', '#627eea', '#14f195', '#f3ba2f', '#23292f', '#c2a633', '#0033ad', '#2a5ada', '#e84142', '#8247e5'];

/**
 * Logo da moeda com fallback para as iniciais
 */
const CoinIcon = ({ symbol, image, size = 28 }) => {
  const [failed, setFailed] = useState(false);
  const src = image || coinIconUrl(symbol);

  if (failed || !symbol) {
    const color = COLORS[(symbol || '?').charCodeAt(0) % COLORS.length];
    return (
      <span className="coin-icon coin-icon-fallback" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
        {(symbol || '?').slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      className="coin-icon"
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

export default memo(CoinIcon);
