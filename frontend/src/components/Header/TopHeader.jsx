import React, { useState, useEffect } from 'react';
import { getCurrentPrice } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './TopHeader.css';

const TopHeader = () => {
  const [bitcoinData, setBitcoinData] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Buscar dados do Bitcoin a cada 30 segundos
  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        const response = await getCurrentPrice();
        if (response.success) {
          setBitcoinData(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar preço:', error);
      }
    };

    fetchBitcoinData();
    const interval = setInterval(fetchBitcoinData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Controlar visibilidade no scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const targetPosition = element.offsetTop - headerHeight - 30;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`top-header ${!isVisible ? 'hidden' : ''}`}>
      <div className="container">
        <nav className="top-nav">
          <div className="nav-brand">
            <div className="brand-icon">₿</div>
            <span className="brand-text">ANALISE BITCONIS</span>
          </div>

          <div className="market-ticker">
            <div className="ticker-item">
              <span className="ticker-symbol">BTC</span>
              <span className="ticker-price">
                {bitcoinData ? formatCurrency(bitcoinData.price) : 'Loading...'}
              </span>
              <span className={`ticker-change ${bitcoinData?.change24h >= 0 ? 'positive' : 'negative'}`}>
                {bitcoinData ? formatPercentage(bitcoinData.change24h) : '...'}
              </span>
            </div>
            <div className="ticker-separator">|</div>
            <div className="ticker-item">
              <span className="ticker-symbol">ETH</span>
              <span className="ticker-price">$4,127</span>
              <span className="ticker-change positive">+1.8%</span>
            </div>
            <div className="ticker-separator">|</div>
            <div className="ticker-item">
              <span className="ticker-symbol">Market</span>
              <span className="ticker-change positive">+3.1%</span>
            </div>
          </div>

          <div className="nav-links">
            <a href="#" className="nav-link active">Dashboard</a>
            <a href="#" className="nav-link">Relatórios</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('analise-tecnica'); }}>
              Análises
            </a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('estrategia'); }}>
              Estratégia
            </a>
            <a href="#" className="nav-link">Portfólio</a>
          </div>

          <div className="nav-actions">
            <button className="action-btn notifications">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge">3</span>
            </button>
            <button className="action-btn settings">⚙️</button>
            <div className="user-profile">
              <div className="avatar">👤</div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default TopHeader;
