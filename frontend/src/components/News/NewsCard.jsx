import React, { memo, useState } from 'react';
import { formatRelativeTime } from '../../utils/formatters';
import { ExternalIcon, NewsIcon } from '../Icons/Icons';

/**
 * Cartão de notícia
 * @param {boolean} featured - Layout grande (destaque)
 * @param {boolean} compact - Layout reduzido (widgets)
 */
const NewsCard = ({ item, featured = false, compact = false, now }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = item.image && !imageFailed;
  const href = /^https?:\/\//i.test(item.url) ? item.url : undefined;

  return (
    <article className={`news-card ${featured ? 'featured' : ''} ${compact ? 'compact' : ''}`}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="news-card-link">
        {!compact && (
          <div className="news-image">
            {showImage ? (
              <img
                src={item.image}
                alt=""
                loading={featured ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="news-image-fallback">
                <NewsIcon size={featured ? 40 : 28} />
              </div>
            )}
            <span className="news-category">{item.category}</span>
          </div>
        )}

        <div className="news-body">
          <div className="news-meta">
            <span className="news-source">{item.source}</span>
            {item.lang === 'en' && <span className="news-lang">EN</span>}
            <span>•</span>
            <time dateTime={item.publishedAt}>{formatRelativeTime(item.publishedAt, now)}</time>
            {compact && <span className="news-category-inline">{item.category}</span>}
          </div>
          <h3 className="news-title">{item.title}</h3>
          {!compact && item.description && <p className="news-description">{item.description}</p>}
          <div className="news-footer">
            {item.alsoReportedBy?.length > 0 && (
              <span className="news-also">Também em: {item.alsoReportedBy.join(', ')}</span>
            )}
            <span className="news-read">
              Ler notícia <ExternalIcon size={13} />
            </span>
          </div>
        </div>
      </a>
    </article>
  );
};

export default memo(NewsCard);
