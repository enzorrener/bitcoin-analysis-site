import React from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { useAsync } from '../../hooks/useAsync';
import { useMarketAnalysis } from '../../hooks/useMarketAnalysis';
import { getNews } from '../../services/api';
import { formatNumber, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import { AlertIcon, LightbulbIcon, ExternalIcon } from '../Icons/Icons';
import './ExecutiveSummary.css';

const TREND_TEXT = {
  alta: 'tendência de alta no longo prazo',
  baixa: 'tendência de baixa no longo prazo',
  lateral: 'um mercado lateral, sem direção definida'
};

const RSI_TEXT = {
  sobrecompra: 'zona de sobrecompra, que costuma anteceder realizações de lucro',
  sobrevenda: 'zona de sobrevenda, que costuma atrair compradores',
  neutro: 'zona neutra, sem excessos de compra ou venda'
};

const Change = ({ value }) => (
  <strong className={value >= 0 ? 'positive' : 'negative'}>{formatPercentage(value)}</strong>
);

const ExecutiveSummary = () => {
  const { analysis, live, fearGreed, global, loading, error } = useMarketAnalysis();
  const { format, formatCompact } = usePreferences();
  const news = useAsync(getNews, []);

  const topNews = news.data?.items?.[0];
  const price = live?.price ?? analysis?.price;

  return (
    <section className="section fade-in" id="resumo">
      <div className="section-header">
        <div className="section-number">1</div>
        <h2>Resumo Executivo</h2>
        <span className="section-tag">Gerado com dados em tempo real</span>
      </div>

      <div className="content-card">
        {loading && (
          <div className="summary-skeleton" aria-busy="true">
            <span className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
          </div>
        )}

        {error && !analysis && (
          <p className="summary-error">
            Não foi possível carregar os dados de mercado agora. Tente novamente em alguns instantes.
          </p>
        )}

        {analysis && (
          <>
            <p className="lead-text">
              O Bitcoin é negociado a <strong className="num">{format(price)}</strong>
              {live && (
                <>, {live.change24h >= 0 ? 'alta' : 'queda'} de <Change value={live.change24h} /> nas últimas 24 horas</>
              )}
              {analysis.change7d != null && (
                <>, acumulando <Change value={analysis.change7d} /> em 7 dias e <Change value={analysis.change30d} /> em 30 dias</>
              )}
              .
              {analysis.changeYtd != null && (
                <> No ano, a variação é de <Change value={analysis.changeYtd} />.</>
              )}
            </p>

            <p>
              No quadro técnico, o preço está <strong>{price > analysis.sma200 ? 'acima' : 'abaixo'}</strong> da
              média móvel de 200 dias (<span className="num">{format(analysis.sma200)}</span>) e{' '}
              <strong>{price > analysis.sma50 ? 'acima' : 'abaixo'}</strong> da média de 50 dias
              (<span className="num">{format(analysis.sma50)}</span>), o que indica {TREND_TEXT[analysis.trend]}.
              O RSI de 14 dias marca <strong className="num">{formatNumber(analysis.rsi, 0)}</strong>, em{' '}
              {RSI_TEXT[analysis.rsiZone]}. Nos últimos 30 dias o BTC oscilou entre{' '}
              <span className="num">{format(analysis.low30)}</span> e <span className="num">{format(analysis.high30)}</span>.
            </p>

            {(global || fearGreed) && (
              <p>
                {global && (
                  <>
                    O mercado cripto soma <strong className="num">{formatCompact(global.totalMarketCap)}</strong> em
                    capitalização (<Change value={global.marketCapChange24h} /> em 24h), com o Bitcoin respondendo por{' '}
                    <strong className="num">{formatNumber(global.btcDominance, 1)}%</strong> do total.{' '}
                  </>
                )}
                {fearGreed && (
                  <>
                    O Índice de Medo &amp; Ganância está em <strong>{fearGreed.value}</strong> ({fearGreed.classification.toLowerCase()}).
                  </>
                )}
              </p>
            )}
          </>
        )}

        {topNews ? (
          <a className="highlight-box" href={/^https?:\/\//i.test(topNews.url) ? topNews.url : undefined} target="_blank" rel="noopener noreferrer">
            <LightbulbIcon size={22} className="highlight-icon" />
            <p>
              <strong>Destaque do dia:</strong> {topNews.title}
              <span className="highlight-meta">
                {topNews.source} • {formatRelativeTime(topNews.publishedAt)} <ExternalIcon size={13} />
              </span>
            </p>
          </a>
        ) : (
          <div className="highlight-box">
            <AlertIcon size={22} className="highlight-icon" />
            <p>
              <strong>Ponto de atenção:</strong> a volatilidade é uma característica do mercado de criptomoedas
              {analysis?.volatility30d != null && (
                <> (volatilidade anualizada de 30 dias: <span className="num">{formatNumber(analysis.volatility30d, 0)}%</span>)</>
              )}
              . Acompanhe as notícias macroeconômicas e defina seu nível de risco antes de investir.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExecutiveSummary;
