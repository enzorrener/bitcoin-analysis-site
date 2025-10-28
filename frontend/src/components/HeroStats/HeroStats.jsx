import React, { useState, useEffect, useRef } from 'react';
import { getMarketStats } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import './HeroStats.css';

const HeroStats = () => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getMarketStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        // Usar dados padrão em caso de erro
        setStats({
          targetPrice2025: 140000,
          resistance: 115000,
          sentiment: 'Alta'
        });
      }
    };

    fetchStats();
  }, []);

  // Intersection Observer para animação
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`hero-stats ${isVisible ? 'visible' : ''}`}
    >
      <div className="stat-card">
        <div className="stat-icon">🎯</div>
        <div className="stat-value">
          {stats ? formatCurrency(stats.targetPrice2025) : 'Loading...'}
        </div>
        <div className="stat-label">Meta 2025</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🛡️</div>
        <div className="stat-value">
          {stats ? formatCurrency(stats.resistance) : 'Loading...'}
        </div>
        <div className="stat-label">Resistência</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-value">
          {stats ? stats.sentiment : 'Loading...'}
        </div>
        <div className="stat-label">Sentimento</div>
      </div>
    </div>
  );
};

export default HeroStats;
