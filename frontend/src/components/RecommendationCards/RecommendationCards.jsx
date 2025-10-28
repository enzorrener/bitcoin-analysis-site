import React from 'react';
import './RecommendationCards.css';

const RecommendationCards = () => {
  return (
    <section className="section fade-in" id="estrategia">
      <div className="section-header">
        <div className="section-number">3</div>
        <h2>Recomendações Estratégicas</h2>
      </div>

      <div className="recommendation-grid">
        <div className="recommendation-card primary">
          <div className="rec-badge hold">Manter Posição</div>
          <h3>Para Investidores Atuais</h3>
          <p>
            Manter a exposição atual ao Bitcoin. O momento de indefinição técnica não justifica
            movimentos abruptos, e o potencial de valorização no médio prazo permanece altamente
            atrativo baseado em fundamentos sólidos.
          </p>
        </div>

        <div className="recommendation-card success">
          <div className="rec-badge buy">Entrada Gradual</div>
          <h3>Para Novos Investidores</h3>
          <p>
            Pequenas aquisições regulares (como R$ 100-500) são altamente recomendadas para iniciar
            posição ou implementar estratégia DCA (Dollar-Cost Averaging), aproveitando o período de
            consolidação favorável.
          </p>
        </div>
      </div>

      <div className="alert-banner">
        <p>
          <strong>Aviso Legal Importante:</strong> Investimentos em criptomoedas envolvem riscos
          significativos de mercado. Invista apenas recursos financeiros que você pode permitir-se
          perder completamente. Este relatório constitui análise educacional e não representa
          aconselhamento financeiro personalizado.
        </p>
      </div>
    </section>
  );
};

export default RecommendationCards;
