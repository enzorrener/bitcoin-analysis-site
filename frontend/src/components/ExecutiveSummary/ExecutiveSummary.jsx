import React from 'react';
import './ExecutiveSummary.css';

const ExecutiveSummary = () => {
  return (
    <section className="section fade-in">
      <div className="section-header">
        <div className="section-number">1</div>
        <h2>Resumo Executivo</h2>
      </div>

      <div className="content-card">
        <p className="lead-text">
          Com base nas notícias recentes, o Bitcoin tem demonstrado um forte otimismo no mercado,
          impulsionado principalmente pela expectativa de cortes de juros nos EUA e pela crescente
          adoção por grandes empresas. O BTC atingiu um novo recorde histórico, superando a marca de
          US$ 124 mil. No entanto, houve uma leve correção, com o preço caindo para cerca de US$ 118 mil
          após atingir a máxima histórica.
        </p>

        <p>
          O mercado de criptomoedas como um todo também está em alta, com um aumento significativo no
          valor de mercado, impulsionado por dados positivos do Índice de Preços ao Consumidor (IPC) dos
          EUA. Isso sugere que a inflação pode estar sob controle, o que geralmente é visto como um sinal
          positivo para ativos de risco como as criptomoedas.
        </p>

        <div className="highlight-box">
          <p>
            <strong>Ponto de atenção crítico:</strong> A volatilidade é uma característica inerente ao
            mercado de criptomoedas, e correções podem ocorrer a qualquer momento. É crucial observar os
            próximos movimentos do mercado e as notícias macroeconômicas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveSummary;
