import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getPriceHistory } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import './BitcoinChart.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BitcoinChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [error, setError] = useState(null);

  const periodLabels = {
    '7': 'Últimos 7 Dias',
    '30': 'Últimos 30 Dias',
    '90': 'Últimos 90 Dias',
    '365': 'Último Ano',
    'max': 'Histórico Completo'
  };

  useEffect(() => {
    fetchChartData(period);
  }, [period]);

  const fetchChartData = async (selectedPeriod) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPriceHistory(selectedPeriod);

      if (response.success && response.data.length > 0) {
        const labels = response.data.map(item => {
          const date = new Date(item.timestamp);
          if (selectedPeriod === '7') {
            return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit' });
          } else if (selectedPeriod === '30' || selectedPeriod === '90') {
            return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short' });
          } else {
            return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
          }
        });

        const prices = response.data.map(item => item.close);

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Preço BTC (USD)',
              data: prices,
              borderColor: '#f7931a',
              backgroundColor: 'rgba(247, 147, 26, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#f7931a',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
            }
          ]
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      setError('Não foi possível carregar os dados do gráfico');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#f5f5f5',
        bodyColor: '#f5f5f5',
        borderColor: '#f7931a',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(42, 42, 42, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#a1a1a1',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(42, 42, 42, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#a1a1a1',
          callback: (value) => formatCurrency(value)
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <section className="section fade-in" id="analise-tecnica">
      <div className="section-header">
        <div className="section-number">2</div>
        <h2>Análise Técnica Avançada</h2>
      </div>

      <div className="chart-section">
        <div className="chart-controls">
          {Object.keys(periodLabels).map((key) => (
            <button
              key={key}
              className={`period-btn ${period === key ? 'active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {key === '7' && '7D'}
              {key === '30' && '30D'}
              {key === '90' && '90D'}
              {key === '365' && '1A'}
              {key === 'max' && 'MÁX'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        )}

        {error && (
          <div className="chart-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && chartData && (
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        <h3>Gráfico BTC/USD - <span>{periodLabels[period]}</span></h3>
        <p className="chart-description">Dados em tempo real via Binance API</p>
      </div>

      <div className="content-card">
        <p>
          O movimento de preços da última semana reflete perfeitamente a consolidação atual do mercado.
          O aumento consistente do poder de processamento da rede (hashrate) indica saúde técnica robusta
          subjacente, enquanto o Índice de Medo & Ganância sugere um equilíbrio saudável entre otimismo
          e cautela prudente.
        </p>
        <p>
          As previsões baseadas em análise técnica de Elliott Wave apontam para potencial de valorização
          significativa até o final de 2025, embora 2026 possa apresentar um cenário mais desafiador,
          seguindo os ciclos históricos característicos do Bitcoin.
        </p>
      </div>
    </section>
  );
};

export default BitcoinChart;
