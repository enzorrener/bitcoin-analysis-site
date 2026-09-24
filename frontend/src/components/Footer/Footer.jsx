import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="brand-icon">₿</span> CryptoAnalysis
          </div>
          <p>
            Análises de Bitcoin e criptomoedas com dados reais e atualizados. Conteúdo para fins educacionais,
            não constitui recomendação de investimento.
          </p>
        </div>

        <nav className="footer-links" aria-label="Rodapé">
          <strong>Navegação</strong>
          <Link to="/">Dashboard</Link>
          <Link to="/noticias">Notícias relevantes</Link>
          <Link to="/app">Meu Painel</Link>
          <Link to="/cadastro">Criar conta</Link>
        </nav>

        <div className="footer-links">
          <strong>Fontes de dados</strong>
          <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer">Binance (cotações)</a>
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko (mercado)</a>
          <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer">Alternative.me (sentimento)</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} CryptoAnalysis • Notícias atualizadas às 09:00 e 18:00 (horário de Brasília)</p>
      </div>
    </footer>
  );
};

export default Footer;
