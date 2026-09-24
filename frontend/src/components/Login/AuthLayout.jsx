import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLivePrices } from '../../hooks/useLivePrices';
import LivePrice, { ChangePill } from '../LivePrice/LivePrice';
import CoinIcon from '../CoinIcon/CoinIcon';
import { CheckIcon, LockIcon } from '../Icons/Icons';
import './Login.css';

const PREVIEW_PAIRS = [
  { pair: 'BTCUSDT', symbol: 'BTC', name: 'Bitcoin' },
  { pair: 'ETHUSDT', symbol: 'ETH', name: 'Ethereum' },
  { pair: 'SOLUSDT', symbol: 'SOL', name: 'Solana' }
];

const FEATURES = [
  'Gráficos com dados reais da Binance',
  'Busca de preços de mais de 100 criptomoedas',
  'Lista de favoritos com cotação ao vivo',
  'Notícias relevantes às 09:00 e 18:00'
];

/**
 * Layout das telas de login e cadastro
 */
const AuthLayout = ({ title, subtitle, children, footer }) => {
  const prices = useLivePrices(PREVIEW_PAIRS.map((p) => p.pair));
  const { isLocalAuth } = useAuth();

  return (
    <div className="login-page">
      <aside className="auth-aside">
        <Link to="/" className="login-brand">
          <div className="login-brand-icon">₿</div>
          <span className="login-brand-text">CryptoAnalysis</span>
        </Link>

        <div className="auth-aside-content">
          <h2>Acompanhe o mercado cripto em tempo real</h2>
          <ul className="auth-features">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <CheckIcon size={16} /> {feature}
              </li>
            ))}
          </ul>

          <div className="auth-prices">
            {PREVIEW_PAIRS.map(({ pair, symbol, name }) => (
              <div className="auth-price-row" key={pair}>
                <CoinIcon symbol={symbol} size={26} />
                <span className="auth-price-name">
                  {name} <small>{symbol}</small>
                </span>
                <LivePrice value={prices[pair]?.price} previous={prices[pair]?.previousPrice} className="auth-price-value" />
                <ChangePill value={prices[pair]?.change24h} showIcon={false} />
              </div>
            ))}
          </div>
        </div>

        <p className="auth-aside-foot">Dados de mercado: Binance • CoinGecko • Alternative.me</p>
      </aside>

      <main className="auth-main">
        <div className="login-card">
          <Link to="/" className="login-brand login-brand-mobile">
            <div className="login-brand-icon">₿</div>
            <span className="login-brand-text">CryptoAnalysis</span>
          </Link>

          <h1 className="login-title">{title}</h1>
          <p className="login-subtitle">{subtitle}</p>

          {children}

          {isLocalAuth && (
            <p className="auth-local-note">
              <LockIcon size={14} /> Modo demonstração: a conta fica salva apenas neste navegador, com senha criptografada.
            </p>
          )}

          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
