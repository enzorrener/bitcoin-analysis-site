import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useAsync } from '../../hooks/useAsync';
import { useLivePrice } from '../../hooks/useLivePrices';
import { getPriceHistory } from '../../services/api';
import { formatReportDate } from '../../utils/formatters';
import LivePrice, { ChangePill } from '../LivePrice/LivePrice';
import Sparkline from '../Sparkline/Sparkline';
import { ArrowRightIcon } from '../Icons/Icons';
import './MainHeader.css';

const MainHeader = () => {
  const { isAuthenticated } = useAuth();
  const { formatCompact, format } = usePreferences();
  const btc = useLivePrice('BTCUSDT');
  const intraday = useAsync(() => getPriceHistory('1', 'BTCUSDT'), [], { refreshInterval: 5 * 60 * 1000 });

  const sparkData = intraday.data ? intraday.data.map((c) => c.close) : null;
  if (sparkData && btc) sparkData[sparkData.length - 1] = btc.price;

  return (
    <section className="main-header">
      <div className="container main-header-grid">
        <div className="hero-copy">
          <p className="subtitle">{formatReportDate()}</p>
          <h1 className="logo">
            <span className="bitcoin-symbol">₿</span>
            Análise Bitcoin
          </h1>
          <p className="hero-lead">
            Cotações em tempo real, indicadores técnicos calculados com dados da Binance e as notícias mais
            relevantes do mercado cripto, atualizadas todos os dias às 09:00 e 18:00.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/app" className="btn btn-primary">
                Abrir meu painel <ArrowRightIcon size={16} />
              </Link>
            ) : (
              <Link to="/cadastro" className="btn btn-primary">
                Criar conta grátis <ArrowRightIcon size={16} />
              </Link>
            )}
            <Link to="/noticias" className="btn btn-ghost">Ver notícias relevantes</Link>
          </div>
        </div>

        <div className="hero-price-card" aria-live="polite">
          <div className="hero-price-top">
            <div>
              <span className="hero-price-label">Bitcoin • BTC</span>
              <LivePrice value={btc?.price} previous={btc?.previousPrice} className="hero-price" />
            </div>
            <ChangePill value={btc?.change24h} />
          </div>

          <div className="hero-spark">
            {sparkData ? <Sparkline data={sparkData} width={320} height={80} strokeWidth={2} /> : <span className="skeleton hero-spark-skeleton" />}
            <span className="hero-spark-label">Últimas 24 horas</span>
          </div>

          <dl className="hero-price-stats">
            <div>
              <dt>Máxima 24h</dt>
              <dd className="num">{btc ? format(btc.high24h) : '—'}</dd>
            </div>
            <div>
              <dt>Mínima 24h</dt>
              <dd className="num">{btc ? format(btc.low24h) : '—'}</dd>
            </div>
            <div>
              <dt>Volume 24h</dt>
              <dd className="num">{btc ? formatCompact(btc.quoteVolume24h) : '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default MainHeader;
