import React, { memo } from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { formatPercentage } from '../../utils/formatters';
import { TrendDownIcon, TrendUpIcon } from '../Icons/Icons';

/**
 * Preço que pisca em verde/vermelho quando muda em tempo real
 * @param {number} value - Valor em USD (convertido para a moeda escolhida)
 * @param {number} previous - Valor anterior (define a cor do destaque)
 */
const LivePrice = ({ value, previous, className = '', options }) => {
  const { format } = usePreferences();

  if (value == null) {
    return <span className={`skeleton ${className}`}>US$ 00.000</span>;
  }

  let flash = '';
  if (previous != null && previous !== value) flash = value > previous ? 'flash-up' : 'flash-down';

  return (
    <span key={value} className={`num live-price ${flash} ${className}`}>
      {format(value, options)}
    </span>
  );
};

/**
 * Pílula de variação percentual com seta
 */
export const ChangePill = memo(({ value, digits = 2, showIcon = true }) => {
  if (value == null || Number.isNaN(value)) return <span className="change-pill">—</span>;
  const positive = value >= 0;
  return (
    <span className={`change-pill ${positive ? 'positive' : 'negative'}`}>
      {showIcon && (positive ? <TrendUpIcon size={13} /> : <TrendDownIcon size={13} />)}
      {formatPercentage(value, digits)}
    </span>
  );
});

ChangePill.displayName = 'ChangePill';

export default memo(LivePrice);
