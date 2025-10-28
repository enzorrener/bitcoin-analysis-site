import React from 'react';
import { formatReportDate } from '../../utils/formatters';
import './MainHeader.css';

const MainHeader = () => {
  return (
    <header className="main-header">
      <div className="container">
        <div className="logo">
          <span className="bitcoin-symbol">₿</span>
          Análise Bitcoin
        </div>
        <p className="subtitle">{formatReportDate()}</p>
      </div>
    </header>
  );
};

export default MainHeader;
