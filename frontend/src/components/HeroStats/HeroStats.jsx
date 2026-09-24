import React from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { useMarketAnalysis } from '../../hooks/useMarketAnalysis';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { GaugeIcon, GlobeIcon, PieIcon, ActivityIcon } from '../Icons/Icons';
import './HeroStats.css';

const fearGreedColor = (value) => {
  if (value <= 25) return 'var(--danger)';
  if (value <= 45) return 'var(--warning)';
  if (value <= 55) return 'var(--secondary)';
  return 'var(--success)';
};

const Value = ({ children, loading }) =>
  loading ? <span className="skeleton">00,0%</span> : children;

const HeroStats = () => {
  const { fearGreed, global } = useMarketAnalysis();
  const { formatCompact } = usePreferences();

  const yesterday = fearGreed?.history?.[1];
  const lastWeek = fearGreed?.history?.[7];

  return (
    <div className="hero-stats">
      <div className="stat-card">
        <div className="stat-icon"><GaugeIcon size={22} /></div>
        <div className="stat-label">Medo &amp; Ganância</div>
        <div className="stat-value num" style={fearGreed ? { color: fearGreedColor(fearGreed.value) } : undefined}>
          <Value loading={!fearGreed}>{fearGreed?.value}<small>/100</small></Value>
        </div>
        <div className="stat-meter" aria-hidden="true">
          <span style={{ left: `${fearGreed?.value ?? 50}%` }} />
        </div>
        <div className="stat-foot">
          {fearGreed ? (
            <>
              <strong>{fearGreed.classification}</strong>
              {yesterday && <span> • ontem {yesterday.value}</span>}
              {lastWeek && <span> • 7d atrás {lastWeek.value}</span>}
            </>
          ) : 'Carregando…'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon"><PieIcon size={22} /></div>
        <div className="stat-label">Dominância do BTC</div>
        <div className="stat-value num">
          <Value loading={!global}>{global && `${formatNumber(global.btcDominance, 1)}%`}</Value>
        </div>
        <div className="stat-bar" aria-hidden="true">
          <span style={{ width: `${global?.btcDominance ?? 0}%` }} />
        </div>
        <div className="stat-foot">
          {global ? `Ethereum: ${formatNumber(global.ethDominance, 1)}% do mercado` : 'Carregando…'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon"><GlobeIcon size={22} /></div>
        <div className="stat-label">Capitalização total</div>
        <div className="stat-value num">
          <Value loading={!global}>{global && formatCompact(global.totalMarketCap)}</Value>
        </div>
        <div className="stat-foot">
          {global ? (
            <>
              <span className={global.marketCapChange24h >= 0 ? 'positive' : 'negative'}>
                {formatPercentage(global.marketCapChange24h)}
              </span>{' '}
              nas últimas 24h
            </>
          ) : 'Carregando…'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon"><ActivityIcon size={22} /></div>
        <div className="stat-label">Volume global 24h</div>
        <div className="stat-value num">
          <Value loading={!global}>{global && formatCompact(global.totalVolume)}</Value>
        </div>
        <div className="stat-foot">
          {global ? `${formatNumber(global.activeCryptocurrencies, 0)} criptomoedas ativas` : 'Carregando…'}
        </div>
      </div>
    </div>
  );
};

export default HeroStats;
