import React, { lazy, Suspense } from 'react';
import { Link, Navigate, Routes, Route } from 'react-router-dom';
import Layout, { PageLoader } from './components/Layout/Layout';
import MainHeader from './components/Header/MainHeader';
import HeroStats from './components/HeroStats/HeroStats';
import ExecutiveSummary from './components/ExecutiveSummary/ExecutiveSummary';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';

// Carregamento sob demanda: cada página baixa apenas o código que usa
const BitcoinChart = lazy(() => import('./components/Chart/BitcoinChart'));
const RecommendationCards = lazy(() => import('./components/RecommendationCards/RecommendationCards'));
const NewsWidget = lazy(() => import('./components/News/NewsWidget'));
const NewsPage = lazy(() => import('./components/News/NewsPage'));
const Painel = lazy(() => import('./components/Painel/Painel'));
const Login = lazy(() => import('./components/Login/Login'));
const Register = lazy(() => import('./components/Register/Register'));
const Profile = lazy(() => import('./components/Profile/Profile'));

const SectionLoader = () => (
  <div className="section">
    <div className="chart-section-placeholder skeleton" style={{ width: '100%', height: 480, borderRadius: 16 }} />
  </div>
);

function Dashboard() {
  return (
    <>
      <MainHeader />
      <div className="container">
        <HeroStats />
        <ExecutiveSummary />
        <Suspense fallback={<SectionLoader />}>
          <BitcoinChart />
          <RecommendationCards />
          <NewsWidget sectionNumber={4} limit={3} />
        </Suspense>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="container not-found">
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <Link to="/" className="btn btn-primary">Voltar ao início</Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Painel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Navigate to="/perfil" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/cadastro"
        element={
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
