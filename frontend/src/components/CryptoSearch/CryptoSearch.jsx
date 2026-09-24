import React, { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { useAsync } from '../../hooks/useAsync';
import { useLivePrices } from '../../hooks/useLivePrices';
import { getCoinsMarkets, searchCoins } from '../../services/api';
import { COINS, COIN_BY_SYMBOL } from '../../utils/coins';
import { formatPercentage } from '../../utils/formatters';
import CoinIcon from '../CoinIcon/CoinIcon';
import LivePrice, { ChangePill } from '../LivePrice/LivePrice';
import Sparkline from '../Sparkline/Sparkline';
import { SearchIcon, SortIcon, StarIcon, CloseIcon } from '../Icons/Icons';
import './CryptoSearch.css';

const PAGE_SIZE = 20;
const LIVE_PAIRS = COINS.map((coin) => coin.pair);

const COLUMNS = [
  { key: 'rank', label: '#', className: 'col-rank' },
  { key: 'name', label: 'Ativo', className: 'col-name' },
  { key: 'price', label: 'Preço', className: 'col-price' },
  { key: 'change24h', label: '24h', className: 'col-change' },
  { key: 'change7d', label: '7d', className: 'col-change col-hide-sm' },
  { key: 'marketCap', label: 'Capitalização', className: 'col-cap col-hide-md' },
  { key: 'sparkline', label: 'Últimos 7 dias', className: 'col-spark col-hide-md', sortable: false }
];

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Converte um item da CoinGecko ou da lista local para o formato da tabela
 */
export const toCoin = (item) => {
  const known = COIN_BY_SYMBOL[item.symbol];
  return {
    id: item.id || known?.id,
    symbol: item.symbol,
    name: item.name || known?.name || item.symbol,
    image: item.image,
    rank: item.rank ?? null,
    // Só consideramos par em tempo real para moedas conhecidas (evita tokens homônimos)
    pair: known && (!item.id || item.id === known.id) ? known.pair : null,
    price: item.price ?? null,
    change24h: item.change24h ?? null,
    change7d: item.change7d ?? null,
    marketCap: item.marketCap ?? null,
    sparkline: item.sparkline || []
  };
};

const CoinRow = memo(({ coin, live, isFavorite, isSelected, isHighlighted, onSelect, onToggleFavorite, formatCompact }) => {
  const price = live?.price ?? coin.price;
  const change24h = live?.change24h ?? coin.change24h;

  return (
    <tr
      className={`${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(coin)}
      aria-selected={isSelected}
    >
      <td className="col-rank">
        <button
          type="button"
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(coin);
          }}
          aria-label={isFavorite ? `Remover ${coin.name} dos favoritos` : `Adicionar ${coin.name} aos favoritos`}
          aria-pressed={isFavorite}
        >
          <StarIcon size={15} filled={isFavorite} />
        </button>
        <span className="rank num">{coin.rank ?? '—'}</span>
      </td>
      <td className="col-name">
        <div className="coin-cell">
          <CoinIcon symbol={coin.symbol} image={coin.image} size={28} />
          <div>
            <strong>{coin.name}</strong>
            <span>{coin.symbol}</span>
          </div>
          {live && <span className="live-tag" title="Preço em tempo real (Binance)">AO VIVO</span>}
        </div>
      </td>
      <td className="col-price">
        <LivePrice value={price} previous={live?.previousPrice} />
      </td>
      <td className="col-change">
        <ChangePill value={change24h} showIcon={false} />
      </td>
      <td className={`col-change col-hide-sm num ${coin.change7d >= 0 ? 'positive' : 'negative'}`}>
        {coin.change7d != null ? formatPercentage(coin.change7d) : '—'}
      </td>
      <td className="col-cap col-hide-md num">{coin.marketCap ? formatCompact(coin.marketCap) : '—'}</td>
      <td className="col-spark col-hide-md">
        <Sparkline data={coin.sparkline} width={110} height={34} />
      </td>
    </tr>
  );
});

CoinRow.displayName = 'CoinRow';

/**
 * Busca e tabela de preços das criptomoedas (atualização em tempo real)
 */
const CryptoSearch = ({ selectedSymbol, favorites, onSelect, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [highlight, setHighlight] = useState(-1);
  const deferredQuery = useDeferredValue(query.trim());
  const inputRef = useRef(null);
  const { formatCompact } = usePreferences();

  const markets = useAsync(getCoinsMarkets, [], { refreshInterval: 120000 });
  const live = useLivePrices(LIVE_PAIRS);

  // Atalho: "/" foca a busca
  useEffect(() => {
    const handleKey = (event) => {
      const tag = event.target.tagName;
      if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Lista base: top 100 da CoinGecko; se indisponível, moedas principais da Binance
  const baseList = useMemo(() => {
    if (markets.data?.length) return markets.data.map(toCoin);
    return COINS.map((coin) => toCoin({ ...coin, rank: coin.order }));
  }, [markets.data]);

  const favoriteSymbols = useMemo(() => new Set(favorites.map((f) => f.symbol)), [favorites]);

  // Ordenar por preço/variação usa o preço ao vivo; nas demais colunas a lista não reordena a cada tick
  const sortLive = sort.key === 'price' || sort.key === 'change24h' ? live : null;

  const rows = useMemo(() => {
    const term = normalize(deferredQuery);
    let list = baseList;

    if (view === 'favorites') {
      const inBase = new Set(list.map((c) => c.symbol));
      list = [...list.filter((c) => favoriteSymbols.has(c.symbol)), ...favorites.filter((f) => !inBase.has(f.symbol)).map(toCoin)];
    }
    if (term) {
      list = list.filter((coin) => normalize(coin.name).includes(term) || normalize(coin.symbol).includes(term));
    }

    const valueOf = (coin, key) => {
      if (key === 'name') return coin.name.toLowerCase();
      if (key === 'price') return sortLive?.[coin.pair]?.price ?? coin.price;
      if (key === 'change24h') return sortLive?.[coin.pair]?.change24h ?? coin.change24h;
      return coin[key];
    };

    return [...list].sort((a, b) => {
      const va = valueOf(a, sort.key);
      const vb = valueOf(b, sort.key);
      if (va == null) return 1;
      if (vb == null) return -1;
      const result = va > vb ? 1 : va < vb ? -1 : 0;
      return sort.dir === 'asc' ? result : -result;
    });
  }, [baseList, deferredQuery, view, sort, favorites, favoriteSymbols, sortLive]);

  // Busca remota (CoinGecko) quando a moeda não está na lista
  const shouldSearchRemote = deferredQuery.length >= 2 && rows.length < 3;
  const [remoteQuery, setRemoteQuery] = useState('');
  useEffect(() => {
    if (!shouldSearchRemote) {
      setRemoteQuery('');
      return undefined;
    }
    const timer = setTimeout(() => setRemoteQuery(deferredQuery), 400);
    return () => clearTimeout(timer);
  }, [shouldSearchRemote, deferredQuery]);

  const remote = useAsync(() => (remoteQuery ? searchCoins(remoteQuery) : Promise.resolve([])), [remoteQuery]);
  const remoteRows = useMemo(() => {
    const shown = new Set(rows.map((r) => r.symbol));
    return (remote.data || []).map(toCoin).filter((coin) => !shown.has(coin.symbol));
  }, [remote.data, rows]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
    setHighlight(-1);
  }, [deferredQuery, view, sort]);

  const visibleRows = rows.slice(0, visible);
  const navigable = [...visibleRows, ...remoteRows];

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, navigable.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter' && navigable[Math.max(highlight, 0)]) {
      event.preventDefault();
      onSelect(navigable[Math.max(highlight, 0)]);
    } else if (event.key === 'Escape') {
      setQuery('');
    }
  };

  const toggleSort = (key) => {
    setSort((current) => ({
      key,
      dir: current.key === key ? (current.dir === 'asc' ? 'desc' : 'asc') : key === 'rank' || key === 'name' ? 'asc' : 'desc'
    }));
  };

  return (
    <section className="crypto-search" aria-labelledby="crypto-search-title">
      <div className="crypto-search-head">
        <div>
          <h2 id="crypto-search-title">Mercado</h2>
          <p>
            {markets.data ? `Top ${markets.data.length} criptomoedas por capitalização` : 'Principais criptomoedas'} •
            preços ao vivo nas moedas marcadas
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Filtro">
          <button type="button" className={view === 'all' ? 'active' : ''} onClick={() => setView('all')} aria-pressed={view === 'all'}>
            Todas
          </button>
          <button type="button" className={view === 'favorites' ? 'active' : ''} onClick={() => setView('favorites')} aria-pressed={view === 'favorites'}>
            Favoritas ({favorites.length})
          </button>
        </div>
      </div>

      <div className="search-box">
        <SearchIcon size={18} />
        <label htmlFor="crypto-search-input" className="sr-only">Buscar criptomoeda</label>
        <input
          id="crypto-search-input"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por nome ou símbolo (ex: Solana, XRP, PEPE)"
          autoComplete="off"
          spellCheck="false"
        />
        {query ? (
          <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Limpar busca">
            <CloseIcon size={16} />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>

      <div className="table-wrap">
        <table className="crypto-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} className={col.className} scope="col" aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <button type="button" onClick={() => toggleSort(col.key)} className={sort.key === col.key ? 'sorted' : ''}>
                      {col.label}
                      <SortIcon size={12} />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.loading && !markets.data && baseList.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="table-empty">Carregando…</td></tr>
            )}
            {visibleRows.map((coin, index) => (
              <CoinRow
                key={coin.id || coin.symbol}
                coin={coin}
                live={coin.pair ? live[coin.pair] : null}
                isFavorite={favoriteSymbols.has(coin.symbol)}
                isSelected={coin.symbol === selectedSymbol}
                isHighlighted={index === highlight}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
                formatCompact={formatCompact}
              />
            ))}
            {remoteRows.length > 0 && (
              <>
                <tr className="table-divider"><td colSpan={COLUMNS.length}>Outros resultados para “{remoteQuery}”</td></tr>
                {remoteRows.map((coin, index) => (
                  <CoinRow
                    key={`remote-${coin.id}`}
                    coin={coin}
                    live={null}
                    isFavorite={favoriteSymbols.has(coin.symbol)}
                    isSelected={coin.symbol === selectedSymbol}
                    isHighlighted={visibleRows.length + index === highlight}
                    onSelect={onSelect}
                    onToggleFavorite={onToggleFavorite}
                    formatCompact={formatCompact}
                  />
                ))}
              </>
            )}
            {rows.length === 0 && remoteRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="table-empty">
                  {remote.loading && remoteQuery ? 'Buscando…' : view === 'favorites' && !deferredQuery
                    ? 'Você ainda não tem favoritas. Clique na estrela ao lado de uma moeda.'
                    : 'Nenhuma criptomoeda encontrada.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > visible && (
        <button type="button" className="btn btn-ghost show-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Mostrar mais ({rows.length - visible} restantes)
        </button>
      )}
    </section>
  );
};

export default CryptoSearch;
