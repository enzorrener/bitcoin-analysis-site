import React, { useState, useEffect } from 'react';
import { getCurrentPrice, getEthereumPrice, getMarketOverview } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './TopHeader.css';

const TopHeader = () => {
  const [bitcoinData, setBitcoinData] = useState(null);
  const [ethereumData, setEthereumData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Buscar dados de todas as moedas a cada 30 segundos
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Buscar BTC, ETH e Market em paralelo
        const [btcResponse, ethResponse, marketResponse] = await Promise.all([
          getCurrentPrice(),
          getEthereumPrice(),
          getMarketOverview()
        ]);

        if (btcResponse.success) {
          setBitcoinData(btcResponse.data);
        }
        if (ethResponse.success) {
          setEthereumData(ethResponse.data);
        }
        if (marketResponse.success) {
          setMarketData(marketResponse.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do mercado:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);

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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.user-profile')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className={`top-header ${!isVisible ? 'hidden' : ''}`}>
      <div className="container">
        <nav className="top-nav">
          <div className="nav-brand">
            <div className="brand-icon">₿</div>
            <span className="brand-text">CryptoAnalysis</span>
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
              <span className="ticker-price">
                {ethereumData ? formatCurrency(ethereumData.price) : 'Loading...'}
              </span>
              <span className={`ticker-change ${ethereumData?.change24h >= 0 ? 'positive' : 'negative'}`}>
                {ethereumData ? formatPercentage(ethereumData.change24h) : '...'}
              </span>
            </div>
            <div className="ticker-separator">|</div>
            <div className="ticker-item">
              <span className="ticker-symbol">Market</span>
              <span className={`ticker-change ${marketData?.change24h >= 0 ? 'positive' : 'negative'}`}>
                {marketData ? formatPercentage(marketData.change24h) : '...'}
              </span>
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
              <div className="avatar" onClick={toggleDropdown}>👤</div>
              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <a href="/login" className="dropdown-item">Entrar</a>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default TopHeader;
