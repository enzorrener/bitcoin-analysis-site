import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getNews } from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';
import TickerBar from '../TickerBar/TickerBar';
import { BellIcon, CloseIcon, LogOutIcon, MenuIcon, UserIcon, ChartIcon } from '../Icons/Icons';
import './TopHeader.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/#analise-tecnica', label: 'Análises', hash: '#analise-tecnica' },
  { to: '/#estrategia', label: 'Estratégia', hash: '#estrategia' },
  { to: '/noticias', label: 'Notícias relevantes' },
  { to: '/app', label: 'Meu Painel' }
];

const isActive = (item, location) => {
  if (item.hash) return location.pathname === '/' && location.hash === item.hash;
  if (item.to === '/') return location.pathname === '/' && !location.hash;
  return location.pathname.startsWith(item.to);
};

/**
 * Sino com as notícias publicadas desde a última visita
 */
const NewsBell = ({ open, onToggle }) => {
  const [news, setNews] = useState(null);
  const [lastSeen, setLastSeen] = useLocalStorage('ba_news_seen', null);

  useEffect(() => {
    // Carrega depois da página para não competir com os dados principais
    const timer = setTimeout(() => {
      getNews().then(setNews).catch(() => setNews(null));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const items = news?.items
    ? [...news.items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    : [];
  const since = lastSeen ? new Date(lastSeen) : new Date(Date.now() - 12 * 36e5);
  const unread = items.filter((item) => new Date(item.publishedAt) > since).length;

  const handleToggle = () => {
    if (!open && items.length) setLastSeen(new Date().toISOString());
    onToggle();
  };

  return (
    <div className="menu-anchor">
      <button
        type="button"
        className="action-btn"
        onClick={handleToggle}
        aria-label={`Notícias${unread ? `: ${unread} novas` : ''}`}
        aria-expanded={open}
      >
        <BellIcon size={18} />
        {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="profile-dropdown news-dropdown" role="menu">
          <div className="dropdown-header">
            <strong>Notícias relevantes</strong>
            <span>Atualizadas às 09:00 e 18:00</span>
          </div>
          {items.length === 0 && <p className="dropdown-empty">Nenhuma notícia disponível no momento.</p>}
          {items.slice(0, 5).map((item) => (
            <a key={item.id} href={/^https?:\/\//i.test(item.url) ? item.url : undefined} target="_blank" rel="noopener noreferrer" className="dropdown-news-item">
              <span className="dropdown-news-title">{item.title}</span>
              <span className="dropdown-news-meta">{item.source} • {formatRelativeTime(item.publishedAt)}</span>
            </a>
          ))}
          <Link to="/noticias" className="dropdown-footer-link" onClick={onToggle}>
            Ver todas as notícias
          </Link>
        </div>
      )}
    </div>
  );
};

const TopHeader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [openMenu, setOpenMenu] = useState(null); // 'news' | 'profile' | 'nav' | null
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { selectedCurrency, setCurrency } = usePreferences();

  // Esconde o menu ao rolar para baixo (listener passivo + requestAnimationFrame)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        setIsVisible(!(currentScrollY > lastScrollY.current && currentScrollY > 140));
        lastScrollY.current = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha menus ao trocar de página
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

  // Fechar menus ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!openMenu) return undefined;

    // composedPath() guarda o caminho original do clique, mesmo que o ícone
    // clicado seja trocado na re-renderização (ex: menu -> fechar)
    const handleClickOutside = (event) => {
      const inside = event
        .composedPath()
        .some((el) => el instanceof Element && el.matches('.menu-anchor, .nav-links, .menu-toggle'));
      if (!inside) setOpenMenu(null);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenu]);

  const toggle = (menu) => setOpenMenu((current) => (current === menu ? null : menu));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header className={`top-header ${!isVisible && !openMenu ? 'hidden' : ''}`}>
      <div className="container">
        <nav className="top-nav" aria-label="Navegação principal">
          <button
            type="button"
            className="menu-toggle action-btn"
            onClick={() => toggle('nav')}
            aria-label="Abrir menu"
            aria-expanded={openMenu === 'nav'}
          >
            {openMenu === 'nav' ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link to="/" className="nav-brand" aria-label="Página inicial">
            <div className="brand-icon">₿</div>
            <span className="brand-text">CryptoAnalysis</span>
          </Link>

          <div className={`nav-links ${openMenu === 'nav' ? 'open' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${isActive(item, location) ? 'active' : ''}`}
                aria-current={isActive(item, location) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            <div className="currency-toggle" role="group" aria-label="Moeda">
              {['USD', 'BRL'].map((code) => (
                <button
                  key={code}
                  type="button"
                  className={selectedCurrency === code ? 'active' : ''}
                  onClick={() => setCurrency(code)}
                  aria-pressed={selectedCurrency === code}
                >
                  {code === 'USD' ? 'US$' : 'R$'}
                </button>
              ))}
            </div>

            <NewsBell open={openMenu === 'news'} onToggle={() => toggle('news')} />

            <div className="menu-anchor user-profile">
              <button
                type="button"
                className={`avatar ${isAuthenticated ? 'logged' : ''}`}
                onClick={() => toggle('profile')}
                aria-label="Conta"
                aria-expanded={openMenu === 'profile'}
              >
                {isAuthenticated && initials ? initials : <UserIcon size={18} />}
              </button>

              {openMenu === 'profile' && (
                <div className="profile-dropdown" role="menu">
                  {isAuthenticated ? (
                    <>
                      <div className="dropdown-header">
                        <strong>{user?.name}</strong>
                        <span>{user?.email}</span>
                      </div>
                      <Link to="/app" className="dropdown-item">
                        <ChartIcon size={16} /> Meu Painel
                      </Link>
                      <button type="button" className="dropdown-item" onClick={handleLogout}>
                        <LogOutIcon size={16} /> Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item">Entrar</Link>
                      <Link to="/cadastro" className="dropdown-item dropdown-item-accent">Criar conta grátis</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      <TickerBar />
    </header>
  );
};

export default TopHeader;
