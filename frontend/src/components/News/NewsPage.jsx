import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { getNews } from '../../services/api';
import { formatBrasiliaDateTime, formatBrasiliaTime, formatCountdown } from '../../utils/formatters';
import { ClockIcon, RefreshIcon, SearchIcon, NewsIcon } from '../Icons/Icons';
import NewsCard from './NewsCard';
import './News.css';

const normalize = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const LANGUAGES = [
  { key: 'all', label: 'Todas' },
  { key: 'pt', label: 'Brasil' },
  { key: 'en', label: 'Internacional' }
];

/**
 * Aba "Notícias relevantes" — atualizada pela rotina às 09:00 e 18:00 (Brasília)
 */
const NewsPage = () => {
  const [forceKey, setForceKey] = useState(0);
  const { data, loading, error, reload } = useAsync(() => getNews(forceKey > 0), [forceKey]);
  const [category, setCategory] = useState('Todas');
  const [language, setLanguage] = useState('all');
  const [sort, setSort] = useState('relevance');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const now = useNow(30000);

  useEffect(() => {
    document.title = 'Notícias relevantes | CryptoAnalysis';
    return () => {
      document.title = 'Análise Bitcoin | Relatório de Mercado';
    };
  }, []);

  // Quando passa do horário da rotina, busca a nova versão automaticamente
  // (no máximo uma nova tentativa a cada 10 minutos enquanto a atualização não chega)
  const nextUpdate = data?.nextUpdateAt ? new Date(data.nextUpdateAt).getTime() : null;
  const lastForced = useRef(0);
  useEffect(() => {
    if (nextUpdate && now > nextUpdate + 5 * 60 * 1000 && now - lastForced.current > 10 * 60 * 1000) {
      lastForced.current = now;
      setForceKey((key) => key + 1);
    }
  }, [now, nextUpdate]);

  const items = data?.items || [];

  const categories = useMemo(() => {
    const counts = items.reduce((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + 1 }), {});
    return [['Todas', items.length], ...Object.entries(counts).sort((a, b) => b[1] - a[1])];
  }, [items]);

  const filtered = useMemo(() => {
    const term = normalize(deferredQuery.trim());
    const list = items.filter((item) => {
      if (category !== 'Todas' && item.category !== category) return false;
      if (language !== 'all' && item.lang !== language) return false;
      if (term && !normalize(`${item.title} ${item.description} ${item.source}`).includes(term)) return false;
      return true;
    });
    if (sort === 'recent') {
      return [...list].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    return list;
  }, [items, category, language, sort, deferredQuery]);

  const isFiltering = category !== 'Todas' || language !== 'all' || deferredQuery.trim() || sort !== 'relevance';
  const [featured, ...rest] = filtered;
  const okSources = data?.sources?.filter((s) => s.ok).length;

  return (
    <div className="container news-page">
      <header className="news-hero">
        <div>
          <span className="news-eyebrow">
            <NewsIcon size={15} /> Curadoria automática
          </span>
          <h1>Notícias relevantes</h1>
          <p>
            As notícias mais importantes do mercado cripto, reunidas de portais brasileiros e internacionais,
            classificadas por relevância e atualizadas todos os dias às <strong>09:00</strong> e{' '}
            <strong>18:00</strong> (horário de Brasília).
          </p>
        </div>

        {data && (
          <div className="news-status">
            <div className="news-status-row">
              <ClockIcon size={16} />
              <span>
                Atualizado em <strong>{formatBrasiliaDateTime(data.updatedAt)}</strong>
              </span>
            </div>
            {nextUpdate && (
              <div className="news-status-row">
                <RefreshIcon size={16} />
                <span>
                  Próxima às <strong>{formatBrasiliaTime(nextUpdate)}</strong>
                  {nextUpdate > now && <> (em {formatCountdown(nextUpdate, now)})</>}
                </span>
              </div>
            )}
            {data.sources && (
              <div className="news-status-sources">
                {okSources}/{data.sources.length} fontes: {data.sources.map((s) => s.name).join(', ')}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="news-toolbar">
        <label className="news-search">
          <SearchIcon size={17} />
          <span className="sr-only">Buscar notícias</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por assunto, moeda ou fonte…"
          />
        </label>

        <div className="news-selects">
          <div className="segmented" role="group" aria-label="Origem">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.key}
                type="button"
                className={language === lang.key ? 'active' : ''}
                onClick={() => setLanguage(lang.key)}
                aria-pressed={language === lang.key}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <label className="news-sort">
            <span className="sr-only">Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Mais relevantes</option>
              <option value="recent">Mais recentes</option>
            </select>
          </label>
        </div>
      </div>

      {items.length > 0 && (
        <div className="news-chips" role="group" aria-label="Categorias">
          {categories.map(([name, count]) => (
            <button
              key={name}
              type="button"
              className={`chip ${category === name ? 'active' : ''}`}
              onClick={() => setCategory(name)}
              aria-pressed={category === name}
            >
              {name} <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && !data && (
        <div className="news-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="news-card skeleton-card">
              <span className="skeleton" />
            </div>
          ))}
        </div>
      )}

      {error && !data && (
        <div className="news-empty-state">
          <p>Não foi possível carregar as notícias agora.</p>
          <button type="button" className="btn btn-ghost" onClick={() => reload()}>
            <RefreshIcon size={16} /> Tentar novamente
          </button>
        </div>
      )}

      {data && items.length === 0 && (
        <div className="news-empty-state">
          <p>Ainda não há notícias coletadas. A rotina roda às 09:00 e 18:00 (horário de Brasília).</p>
        </div>
      )}

      {items.length > 0 && filtered.length === 0 && (
        <div className="news-empty-state">
          <p>Nenhuma notícia encontrada com esses filtros.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setCategory('Todas');
              setLanguage('all');
              setQuery('');
              setSort('relevance');
            }}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {!isFiltering && featured && (
            <div className="news-featured-wrap">
              <NewsCard item={featured} featured now={now} />
            </div>
          )}
          <div className="news-grid">
            {(isFiltering ? filtered : rest).map((item) => (
              <NewsCard key={item.id} item={item} now={now} />
            ))}
          </div>
        </>
      )}

      <p className="news-disclaimer">
        Os títulos e resumos pertencem aos respectivos portais. Clique em uma notícia para ler o conteúdo completo na fonte original.
      </p>
    </div>
  );
};

export default NewsPage;
