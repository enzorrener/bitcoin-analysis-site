import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { usePreferences } from '../../context/PreferencesContext';
import { useAsync } from '../../hooks/useAsync';
import { useLivePrice } from '../../hooks/useLivePrices';
import { useMarketAnalysis } from '../../hooks/useMarketAnalysis';
import { getCoinChart, getPriceHistory } from '../../services/api';
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import { sma } from '../../utils/indicators';
import { RefreshIcon } from '../Icons/Icons';
import { ChangePill } from '../LivePrice/LivePrice';
import './BitcoinChart.css';

// Registrar apenas os componentes usados do Chart.js (bundle menor)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const PERIODS = [
  { key: '1', label: '24H', title: 'Últimas 24 Horas' },
  { key: '7', label: '7D', title: 'Últimos 7 Dias' },
  { key: '30', label: '30D', title: 'Últimos 30 Dias' },
  { key: '90', label: '90D', title: 'Últimos 90 Dias' },
  { key: '365', label: '1A', title: 'Último Ano' },
  { key: 'max', label: 'MÁX', title: 'Histórico Completo' }
];

const OVERLAYS = [
  { key: 'sma20', label: 'MM20', period: 20, color: '#3b82f6' },
  { key: 'sma50', label: 'MM50', period: 50, color: '#a855f7' }
];

const formatLabel = (timestamp, period) => {
  const date = new Date(timestamp);
  if (period === '1') return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (period === '7') return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit' });
  if (period === '30' || period === '90') return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short' });
  return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
};

const areaGradient = (context) => {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(247, 147, 26, 0.1)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(247, 147, 26, 0.28)');
  gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');
  return gradient;
};

/**
 * Texto e níveis técnicos exibidos abaixo do gráfico na página inicial
 */
const TechnicalAnalysis = () => {
  const { analysis } = useMarketAnalysis();
  const { format } = usePreferences();

  if (!analysis) return null;

  const levels = [
    { label: 'Suporte (mín. 30d)', value: format(analysis.support), hint: formatPercentage(analysis.distanceToSupport) },
    { label: 'Resistência (máx. 30d)', value: format(analysis.resistance), hint: formatPercentage(analysis.distanceToResistance) },
    { label: 'Média móvel 50d', value: format(analysis.sma50), hint: analysis.price > analysis.sma50 ? 'Preço acima' : 'Preço abaixo' },
    { label: 'Média móvel 200d', value: analysis.sma200 ? format(analysis.sma200) : '—', hint: analysis.sma200 ? (analysis.price > analysis.sma200 ? 'Preço acima' : 'Preço abaixo') : '' },
    { label: 'RSI (14 dias)', value: formatNumber(analysis.rsi, 0), hint: analysis.rsiZone },
    { label: 'Volatilidade 30d', value: `${formatNumber(analysis.volatility30d, 0)}%`, hint: 'anualizada' }
  ];

  const crossText = analysis.sma50 > analysis.sma200
    ? 'A média de 50 dias está acima da de 200 dias, configuração conhecida como "golden cross", típica de ciclos de alta.'
    : 'A média de 50 dias está abaixo da de 200 dias, configuração conhecida como "death cross", típica de fases de correção.';

  return (
    <div className="content-card">
      <div className="levels-grid">
        {levels.map((level) => (
          <div className="level-item" key={level.label}>
            <span className="level-label">{level.label}</span>
            <strong className="level-value num">{level.value}</strong>
            <span className="level-hint">{level.hint}</span>
          </div>
        ))}
      </div>
      <p>
        O preço está a <strong className="num">{formatPercentage(analysis.distanceToResistance)}</strong> da resistência
        de 30 dias e a <strong className="num">{formatPercentage(analysis.distanceToSupport)}</strong> do suporte. {analysis.sma200 && crossText}
      </p>
      <p>
        A máxima das últimas 52 semanas foi de <strong className="num">{format(analysis.high365)}</strong>. Rompimentos
        acima da resistência com volume crescente tendem a confirmar continuidade; perdas do suporte sinalizam
        maior probabilidade de correção. Indicadores recalculados automaticamente a cada atualização de preço.
      </p>
    </div>
  );
};

/**
 * Gráfico de preços com períodos, médias móveis e último ponto em tempo real
 * @param {string} symbol - Par da Binance (ex: ETHUSDT)
 * @param {string} coinId - Id na CoinGecko (fallback quando não há par na Binance)
 * @param {string} name - Nome exibido
 * @param {boolean} asSection - Exibe como seção numerada da página inicial
 */
const BitcoinChart = ({ symbol = 'BTCUSDT', coinId = 'bitcoin', name = 'Bitcoin', asSection = true, defaultPeriod = '7' }) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [overlays, setOverlays] = useState({ sma20: false, sma50: false });
  const { currency, rate } = usePreferences();
  const live = useLivePrice(symbol);

  const history = useAsync(async () => {
    try {
      return { source: 'Binance', candles: await getPriceHistory(period, symbol) };
    } catch (error) {
      if (!coinId) throw error;
      return { source: 'CoinGecko', candles: await getCoinChart(coinId, period) };
    }
  }, [period, symbol, coinId], { refreshInterval: period === '1' ? 60000 : 300000 });

  const livePrice = live?.price;

  // Substitui o último ponto pelo preço ao vivo nos períodos curtos
  const candles = useMemo(() => {
    const list = history.data?.candles;
    if (!list?.length) return null;
    if (!livePrice || history.data.source !== 'Binance' || !['1', '7'].includes(period)) return list;
    const copy = list.slice();
    const last = copy[copy.length - 1];
    copy[copy.length - 1] = { ...last, close: livePrice, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice) };
    return copy;
  }, [history.data, livePrice, period]);

  const stats = useMemo(() => {
    if (!candles) return null;
    const first = candles[0].open ?? candles[0].close;
    const last = candles[candles.length - 1].close;
    return {
      last,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      change: ((last - first) / first) * 100
    };
  }, [candles]);

  const chartData = useMemo(() => {
    if (!candles) return null;
    const closes = candles.map((c) => c.close);

    const datasets = [
      {
        label: `${name}`,
        data: closes.map((v) => v * rate),
        borderColor: '#f7931a',
        backgroundColor: areaGradient,
        borderWidth: 2.2,
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#f7931a',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        order: 1
      }
    ];

    OVERLAYS.forEach((overlay) => {
      if (!overlays[overlay.key]) return;
      datasets.push({
        label: overlay.label,
        data: sma(closes, overlay.period).map((v) => (v == null ? null : v * rate)),
        borderColor: overlay.color,
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.25,
        order: 0
      });
    });

    return { labels: candles.map((c) => formatLabel(c.timestamp, period)), datasets };
  }, [candles, overlays, rate, name, period]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(18, 23, 34, 0.96)',
          titleColor: '#e8ecf3',
          bodyColor: '#e8ecf3',
          borderColor: 'rgba(247, 147, 26, 0.6)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#8b95a7', maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 11 } }
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(139, 149, 167, 0.08)' },
          border: { display: false },
          ticks: {
            color: '#8b95a7',
            font: { size: 11 },
            maxTicksLimit: 6,
            callback: (value) => (Math.abs(value) >= 10000 ? formatCompactCurrency(value, currency) : formatCurrency(value, currency))
          }
        }
      },
      interaction: { mode: 'index', axis: 'x', intersect: false }
    }),
    [currency]
  );

  const periodTitle = PERIODS.find((p) => p.key === period)?.title;
  const toCurrency = (value) => formatCurrency(value * rate, currency);

  const chartCard = (
    <div className="chart-section">
      <div className="chart-head">
        <div>
          <h3>
            {name} <span>{periodTitle}</span>
          </h3>
          {stats && (
            <div className="chart-price">
              <strong className="num">{toCurrency(stats.last)}</strong>
              <ChangePill value={stats.change} />
              <span className="chart-period-note">no período</span>
            </div>
          )}
        </div>

        <div className="chart-controls" role="group" aria-label="Período do gráfico">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`period-btn ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-toolbar">
        <div className="overlay-toggles">
          {OVERLAYS.map((overlay) => (
            <label key={overlay.key} className={`overlay-toggle ${overlays[overlay.key] ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={overlays[overlay.key]}
                onChange={() => setOverlays((prev) => ({ ...prev, [overlay.key]: !prev[overlay.key] }))}
              />
              <span className="overlay-swatch" style={{ background: overlay.color }} />
              {overlay.label}
            </label>
          ))}
        </div>
        {stats && (
          <div className="chart-stats">
            <span>Máx <strong className="num">{toCurrency(stats.high)}</strong></span>
            <span>Mín <strong className="num">{toCurrency(stats.low)}</strong></span>
          </div>
        )}
      </div>

      <div className="chart-container">
        {history.loading && !chartData && (
          <div className="chart-loading">
            <div className="loading-spinner" />
            <p>Carregando dados...</p>
          </div>
        )}

        {history.error && !chartData && (
          <div className="chart-error">
            <p>Não foi possível carregar os dados do gráfico.</p>
            <button type="button" className="btn btn-ghost" onClick={() => history.reload()}>
              <RefreshIcon size={16} /> Tentar novamente
            </button>
          </div>
        )}

        {chartData && <Line data={chartData} options={chartOptions} aria-label={`Gráfico de preço ${name}`} role="img" />}
      </div>

      <p className="chart-description">
        Dados reais via {history.data?.source || 'Binance'} API
        {live && ['1', '7'].includes(period) && history.data?.source === 'Binance' ? ' • último ponto em tempo real' : ''}
      </p>
    </div>
  );

  if (!asSection) return chartCard;

  return (
    <section className="section fade-in" id="analise-tecnica">
      <div className="section-header">
        <div className="section-number">2</div>
        <h2>Análise Técnica Avançada</h2>
      </div>
      {chartCard}
      <TechnicalAnalysis />
    </section>
  );
};

export default BitcoinChart;
