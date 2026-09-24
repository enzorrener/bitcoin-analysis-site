import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLivePrice } from '../hooks/useLivePrices';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters';
import { USD_BRL_PAIR } from '../utils/coins';

const PreferencesContext = createContext(null);

/**
 * Preferências do usuário: moeda de exibição (USD ou BRL)
 */
export const PreferencesProvider = ({ children }) => {
  const [currency, setCurrency] = useLocalStorage('ba_currency', 'USD');
  // Cotação USDT/BRL em tempo real (só assina quando o real está selecionado)
  const usdBrl = useLivePrice(currency === 'BRL' ? USD_BRL_PAIR : null);
  const rate = currency === 'BRL' ? usdBrl?.price ?? null : 1;
  const activeCurrency = rate ? currency : 'USD';

  const convert = useCallback((usdValue) => (usdValue == null ? null : usdValue * (rate || 1)), [rate]);

  const value = useMemo(
    () => ({
      currency: activeCurrency,
      selectedCurrency: currency,
      setCurrency,
      rate: rate || 1,
      convert,
      format: (usdValue, options) => formatCurrency(convert(usdValue), activeCurrency, options),
      formatCompact: (usdValue) => formatCompactCurrency(convert(usdValue), activeCurrency)
    }),
    [activeCurrency, currency, setCurrency, rate, convert]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);
