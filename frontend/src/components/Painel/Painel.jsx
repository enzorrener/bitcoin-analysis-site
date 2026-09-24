import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useAsync } from '../../hooks/useAsync';
import { useLivePrices } from '../../hooks/useLivePrices';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getFearGreed, getGlobalMarket } from '../../services/api';
import { COIN_BY_PAIR, DEFAULT_WATCHLIST } from '../../utils/coins';
import { formatNumber } from '../../utils/formatters';
import BitcoinChart from '../Chart/BitcoinChart';
import CryptoSearch from '../CryptoSearch/CryptoSearch';
import Converter from '../Converter/Converter';
import NewsWidget from '../News/NewsWidget';
import CoinIcon from '../CoinIcon/CoinIcon';
import LivePrice, { ChangePill } from '../LivePrice/LivePrice';
import { CloseIcon, StarIcon } from '../Icons/Icons';
import '../Converter/Converter.css';
import './Painel.css';

const DEFAULT_FAVORITES = DEFAULT_WATCHLIST.map((pair) => {
  const { symbol, name, id } = COIN_BY_PAIR[pair];
  return { symbol, name, id, pair };
});

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()));
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

/**
 * Lista de favoritas com preço ao vivo
 */
const Watchlist = ({ favorites, selectedSymbol, onSelect, onRemove }) => {
  const livePairs = favorites.map((f) => f.pair).filter(Boolean);
  const prices = useLivePrices(livePairs);

  return (
    <div className="side-card watchlist">
      <div className="side-card-head">
        <h3>Favoritas</h3>
        <span className="side-card-hint">{favorites.length} ativos</span>
      </div>

      {favorites.length === 0 && (
        <p className="watchlist-empty">
          Clique na <StarIcon size={13} /> de uma moeda na tabela para acompanhá-la aqui.
        </p>
      )}

      <ul>
        {favorites.map((fav) => {
          const ticker = fav.pair ? prices[fav.pair] : null;
          return (
            <li key={fav.symbol} className={fav.symbol === selectedSymbol ? 'selected' : ''}>
              <button type="button" className="watchlist-item" onClick={() => onSelect(fav)}>
                <CoinIcon symbol={fav.symbol} image={fav.image} size={30} />
                <span className="watchlist-name">
                  <strong>{fav.symbol}</strong>
                  <small>{fav.name}</small>
                </span>
                <span className="watchlist-price">
                  <LivePrice value={ticker?.price ?? fav.price} previous={ticker?.previousPrice} />
                  <ChangePill value={ticker?.change24h ?? fav.change24h} showIcon={false} />
                </span>
              </button>
              <button type="button" className="watchlist-remove" onClick={() => onRemove(fav)} aria-label={`Remover ${fav.name}`}>
                <CloseIcon size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Tela principal após o login: gráfico, busca de preços, favoritas e conversor
 */
const Painel = () => {
  const { user, isLocalAuth } = useAuth();
  const location = useLocation();
  const { formatCompact } = usePreferences();
  const storageKey = `ba_watchlist_${user?.id || 'guest'}`;
  const [favorites, setFavorites] = useLocalStorage(storageKey, DEFAULT_FAVORITES);
  const [selected, setSelected] = useLocalStorage(`ba_selected_${user?.id || 'guest'}`, DEFAULT_FAVORITES[0]);
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.welcome));
  const chartRef = useRef(null);

  const global = useAsync(getGlobalMarket, [], { refreshInterval: 5 * 60 * 1000 });
  const fearGreed = useAsync(getFearGreed, []);
  const kpiPrices = useLivePrices(['BTCUSDT', 'ETHUSDT']);

  useEffect(() => {
    document.title = 'Meu Painel | CryptoAnalysis';
    return () => {
      document.title = 'Análise Bitcoin | Relatório de Mercado';
    };
  }, []);

  const handleSelect = useCallback(
    (coin) => {
      setSelected({ symbol: coin.symbol, name: coin.name, id: coin.id, pair: coin.pair || `${coin.symbol}USDT`, image: coin.image });
      // Em telas pequenas, leva o usuário até o gráfico
      if (window.innerWidth < 1100) {
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [setSelected]
  );

  const toggleFavorite = useCallback(
    (coin) => {
      setFavorites((current) =>
        current.some((f) => f.symbol === coin.symbol)
          ? current.filter((f) => f.symbol !== coin.symbol)
          : [...current, { symbol: coin.symbol, name: coin.name, id: coin.id, pair: coin.pair, image: coin.image, price: coin.price, change24h: coin.change24h }]
      );
    },
    [setFavorites]
  );

  const firstName = useMemo(() => user?.name?.split(' ')[0] || '', [user]);
  const btc = kpiPrices.BTCUSDT;
  const eth = kpiPrices.ETHUSDT;

  return (
    <div className="container painel">
      <header className="painel-header">
        <div>
          <p className="painel-greeting">{greeting()}, {firstName}</p>
          <h1>Seu painel de mercado</h1>
          <p className="painel-sub">
            Cotações em tempo real da Binance. Use a busca (tecla <kbd>/</kbd>) para encontrar qualquer criptomoeda.
          </p>
        </div>
      </header>

      {showWelcome && (
        <div className="welcome-banner" role="status">
          <div>
            <strong>Conta criada com sucesso!</strong> Adicione moedas às favoritas clicando na estrela e selecione
            qualquer ativo da tabela para ver o gráfico.
            {isLocalAuth && ' (Modo demonstração: seus dados ficam salvos neste navegador.)'}
          </div>
          <button type="button" onClick={() => setShowWelcome(false)} aria-label="Fechar">
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      <div className="painel-kpis">
        <div className="kpi">
          <span className="kpi-label">Bitcoin</span>
          <LivePrice value={btc?.price} previous={btc?.previousPrice} className="kpi-value" />
          <ChangePill value={btc?.change24h} />
        </div>
        <div className="kpi">
          <span className="kpi-label">Ethereum</span>
          <LivePrice value={eth?.price} previous={eth?.previousPrice} className="kpi-value" />
          <ChangePill value={eth?.change24h} />
        </div>
        <div className="kpi">
          <span className="kpi-label">Capitalização total</span>
          <span className="kpi-value num">{global.data ? formatCompact(global.data.totalMarketCap) : '—'}</span>
          <ChangePill value={global.data?.marketCapChange24h} />
        </div>
        <div className="kpi">
          <span className="kpi-label">Dominância BTC</span>
          <span className="kpi-value num">{global.data ? `${formatNumber(global.data.btcDominance, 1)}%` : '—'}</span>
          <span className="kpi-foot">ETH {global.data ? `${formatNumber(global.data.ethDominance, 1)}%` : '—'}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Medo &amp; Ganância</span>
          <span className="kpi-value num">{fearGreed.data ? fearGreed.data.value : '—'}</span>
          <span className="kpi-foot">{fearGreed.data?.classification || ''}</span>
        </div>
      </div>

      <div className="painel-grid">
        <div className="painel-main">
          <div ref={chartRef} className="painel-chart">
            <BitcoinChart
              key={selected.symbol}
              symbol={selected.pair || `${selected.symbol}USDT`}
              coinId={selected.id}
              name={`${selected.name} (${selected.symbol})`}
              asSection={false}
              defaultPeriod="7"
            />
          </div>
          <CryptoSearch
            selectedSymbol={selected.symbol}
            favorites={favorites}
            onSelect={handleSelect}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        <aside className="painel-side">
          <Watchlist
            favorites={favorites}
            selectedSymbol={selected.symbol}
            onSelect={handleSelect}
            onRemove={toggleFavorite}
          />
          <Converter defaultPair={selected.pair && COIN_BY_PAIR[selected.pair] ? selected.pair : 'BTCUSDT'} />
          <div className="side-card">
            <NewsWidget compact limit={5} title="Últimas notícias" />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Painel;
