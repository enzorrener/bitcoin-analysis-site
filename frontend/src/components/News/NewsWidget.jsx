import React from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { getNews } from '../../services/api';
import { formatBrasiliaDateTime } from '../../utils/formatters';
import { ArrowRightIcon } from '../Icons/Icons';
import NewsCard from './NewsCard';
import './News.css';

/**
 * Bloco com as principais notícias (página inicial e painel)
 * @param {number} limit - Quantidade de notícias
 * @param {number} sectionNumber - Exibe como seção numerada da página inicial
 */
const NewsWidget = ({ limit = 3, sectionNumber, compact = false, title = 'Notícias relevantes' }) => {
  const { data, loading, error } = useAsync(getNews, []);
  const items = data?.items?.slice(0, limit) || [];

  const header = (
    <div className="section-header">
      {sectionNumber && <div className="section-number">{sectionNumber}</div>}
      <h2>{title}</h2>
      <Link to="/noticias" className="section-link">
        Ver todas <ArrowRightIcon size={15} />
      </Link>
    </div>
  );

  const body = (
    <>
      {data?.updatedAt && (
        <p className="news-widget-updated">
          Atualizado em {formatBrasiliaDateTime(data.updatedAt)} • próxima atualização {formatBrasiliaDateTime(data.nextUpdateAt)}
        </p>
      )}
      {loading && !data && (
        <div className={`news-grid ${compact ? 'compact' : ''}`}>
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className={`news-card skeleton-card ${compact ? 'compact' : ''}`}>
              <span className="skeleton" />
            </div>
          ))}
        </div>
      )}
      {error && !data && <p className="news-empty">Não foi possível carregar as notícias agora.</p>}
      {data && items.length === 0 && (
        <p className="news-empty">As notícias serão exibidas após a próxima atualização (09:00 ou 18:00).</p>
      )}
      {items.length > 0 && (
        <div className={`news-grid ${compact ? 'compact' : ''}`}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} compact={compact} />
          ))}
        </div>
      )}
    </>
  );

  if (sectionNumber) {
    return (
      <section className="section" id="noticias">
        {header}
        {body}
      </section>
    );
  }

  return (
    <div className="news-widget">
      {header}
      {body}
    </div>
  );
};

export default NewsWidget;
