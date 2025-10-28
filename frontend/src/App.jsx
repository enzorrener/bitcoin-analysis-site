import React from 'react';
import TopHeader from './components/Header/TopHeader';
import MainHeader from './components/Header/MainHeader';
import HeroStats from './components/HeroStats/HeroStats';
import ExecutiveSummary from './components/ExecutiveSummary/ExecutiveSummary';
import BitcoinChart from './components/Chart/BitcoinChart';
import RecommendationCards from './components/RecommendationCards/RecommendationCards';
import Footer from './components/Footer/Footer';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <TopHeader />
      <MainHeader />

      <main className="main-content">
        <div className="container">
          <HeroStats />
          <ExecutiveSummary />
          <BitcoinChart />
          <RecommendationCards />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
