import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopHeader from '../Header/TopHeader';
import Footer from '../Footer/Footer';

/**
 * Rola até a seção indicada no endereço (ex: /#estrategia) ou volta ao topo ao trocar de página
 */
const useScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      const element = document.getElementById(hash.slice(1));
      attempts += 1;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clearInterval(timer);
      } else if (attempts > 30) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [pathname, hash]);
};

export const PageLoader = () => (
  <div className="page-loader" aria-busy="true">
    <div className="spinner" />
  </div>
);

/**
 * Estrutura comum das páginas (menu + conteúdo + rodapé)
 */
const Layout = () => {
  useScrollToHash();

  return (
    <div className="app">
      <TopHeader />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
