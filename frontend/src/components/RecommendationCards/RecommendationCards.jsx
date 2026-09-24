import React from 'react';
import { useMarketAnalysis } from '../../hooks/useMarketAnalysis';
import { AlertIcon, CheckIcon } from '../Icons/Icons';
import './RecommendationCards.css';

/**
 * Textos de cada postura calculada pelos indicadores
 */
const STANCES = {
  accumulate: {
    current: {
      badge: 'Manter e acumular',
      tone: 'buy',
      text: 'Os indicadores combinados apontam um cenário favorável. Manter a exposição atual e reforçar posições de forma gradual é coerente com o momento, sempre respeitando o seu limite de risco.'
    },
    newcomer: {
      badge: 'Entrada gradual (DCA)',
      tone: 'buy',
      text: 'Pequenas compras regulares (por exemplo R$ 100 a R$ 500 por mês) diluem o preço médio e reduzem o impacto da volatilidade. O cenário atual favorece iniciar a estratégia de aportes periódicos.'
    }
  },
  hold: {
    current: {
      badge: 'Manter posição',
      tone: 'hold',
      text: 'Os sinais estão mistos. O momento de indefinição técnica não justifica movimentos bruscos: manter a posição e acompanhar suporte e resistência é a abordagem mais prudente.'
    },
    newcomer: {
      badge: 'DCA com disciplina',
      tone: 'hold',
      text: 'Sem uma direção clara, a estratégia de aportes periódicos (DCA) com valores pequenos permite começar sem tentar acertar o melhor momento de entrada.'
    }
  },
  caution: {
    current: {
      badge: 'Proteger ganhos',
      tone: 'sell',
      text: 'Os indicadores sugerem cautela. Revisar o tamanho da posição, definir níveis de saída e evitar alavancagem ajudam a proteger o patrimônio em possíveis correções.'
    },
    newcomer: {
      badge: 'Entrada cautelosa',
      tone: 'sell',
      text: 'O cenário pede paciência. Se quiser começar, prefira valores bem pequenos e espaçados no tempo, aguardando sinais mais claros de recuperação antes de aumentar os aportes.'
    }
  }
};

const RecommendationCards = () => {
  const { signal, loading } = useMarketAnalysis();
  const stance = STANCES[signal?.stance || 'hold'];

  return (
    <section className="section fade-in" id="estrategia">
      <div className="section-header">
        <div className="section-number">3</div>
        <h2>Recomendações Estratégicas</h2>
      </div>

      <div className="recommendation-grid">
        <div className={`recommendation-card ${stance.current.tone}`}>
          <div className={`rec-badge ${stance.current.tone}`}>{loading ? 'Calculando…' : stance.current.badge}</div>
          <h3>Para Investidores Atuais</h3>
          <p>{stance.current.text}</p>
        </div>

        <div className={`recommendation-card ${stance.newcomer.tone}`}>
          <div className={`rec-badge ${stance.newcomer.tone}`}>{loading ? 'Calculando…' : stance.newcomer.badge}</div>
          <h3>Para Novos Investidores</h3>
          <p>{stance.newcomer.text}</p>
        </div>
      </div>

      {signal && (
        <div className="signal-reasons">
          <h4>Por que este sinal?</h4>
          <ul>
            {signal.reasons.map((reason) => (
              <li key={reason}>
                <CheckIcon size={16} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="alert-banner" role="note">
        <AlertIcon size={22} className="alert-icon" />
        <p>
          <strong>Aviso Legal Importante:</strong> Investimentos em criptomoedas envolvem riscos
          significativos de mercado. Invista apenas recursos financeiros que você pode permitir-se
          perder completamente. Os sinais acima são gerados automaticamente a partir de indicadores
          técnicos, têm caráter educacional e não representam aconselhamento financeiro personalizado.
        </p>
      </div>
    </section>
  );
};

export default RecommendationCards;
