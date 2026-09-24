/**
 * Indicadores técnicos calculados a partir de candles reais
 */

/**
 * Média móvel simples. Retorna array do mesmo tamanho (null até ter dados suficientes).
 */
export const sma = (values, period) => {
  const result = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) result[i] = sum / period;
  }
  return result;
};

/**
 * Índice de Força Relativa (RSI) pelo método de Wilder
 */
export const rsi = (values, period = 14) => {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const pctChange = (from, to) => (from ? ((to - from) / from) * 100 : null);

/**
 * Volatilidade anualizada (desvio padrão dos retornos diários)
 */
const volatility = (values) => {
  if (values.length < 3) return null;
  const returns = values.slice(1).map((v, i) => Math.log(v / values[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
};

/**
 * Resume a situação técnica a partir de candles DIÁRIOS
 * @param {Array} candles - [{ close, high, low, timestamp }]
 * @param {number} livePrice - Preço atual (opcional, substitui o último fechamento)
 */
export const analyzeMarket = (candles, livePrice) => {
  if (!candles || candles.length < 30) return null;

  const closes = candles.map((c) => c.close);
  if (livePrice) closes[closes.length - 1] = livePrice;

  const price = closes[closes.length - 1];
  const sma50 = sma(closes, 50).at(-1);
  const sma200 = sma(closes, 200).at(-1);
  const last30 = candles.slice(-30);
  const high30 = Math.max(...last30.map((c) => c.high), price);
  const low30 = Math.min(...last30.map((c) => c.low), price);
  const rsi14 = rsi(closes, 14);

  let trend = 'lateral';
  if (sma50 && sma200) {
    if (price > sma200 && sma50 > sma200) trend = 'alta';
    else if (price < sma200 && sma50 < sma200) trend = 'baixa';
  } else if (sma50) {
    trend = price > sma50 ? 'alta' : 'baixa';
  }

  let rsiZone = 'neutro';
  if (rsi14 >= 70) rsiZone = 'sobrecompra';
  else if (rsi14 <= 30) rsiZone = 'sobrevenda';

  const yearStart = candles.find((c) => new Date(c.timestamp).getFullYear() === new Date().getFullYear());

  return {
    price,
    sma50,
    sma200,
    rsi: rsi14,
    rsiZone,
    trend,
    high30,
    low30,
    support: low30,
    resistance: high30,
    distanceToResistance: pctChange(price, high30),
    distanceToSupport: pctChange(price, low30),
    change7d: pctChange(closes.at(-8), price),
    change30d: pctChange(closes.at(-31), price),
    changeYtd: yearStart ? pctChange(yearStart.open ?? yearStart.close, price) : null,
    high365: Math.max(...candles.map((c) => c.high)),
    volatility30d: volatility(closes.slice(-31))
  };
};

/**
 * Gera um sinal educativo combinando tendência, RSI e sentimento
 * @returns {{ stance: 'accumulate'|'hold'|'caution', score: number, reasons: string[] }}
 */
export const buildSignal = (analysis, fearGreed) => {
  if (!analysis) return null;

  let score = 0;
  const reasons = [];

  if (analysis.trend === 'alta') {
    score += 1;
    reasons.push('Preço acima da média móvel de 200 dias (tendência de alta)');
  } else if (analysis.trend === 'baixa') {
    score -= 1;
    reasons.push('Preço abaixo da média móvel de 200 dias (tendência de baixa)');
  } else {
    reasons.push('Médias móveis sem direção clara (mercado lateral)');
  }

  if (analysis.rsiZone === 'sobrevenda') {
    score += 1;
    reasons.push(`RSI em ${analysis.rsi.toFixed(0)}: ativo sobrevendido`);
  } else if (analysis.rsiZone === 'sobrecompra') {
    score -= 1;
    reasons.push(`RSI em ${analysis.rsi.toFixed(0)}: ativo sobrecomprado`);
  } else if (analysis.rsi != null) {
    reasons.push(`RSI em ${analysis.rsi.toFixed(0)}: zona neutra`);
  }

  if (fearGreed) {
    if (fearGreed.value <= 25) {
      score += 1;
      reasons.push(`Medo extremo (${fearGreed.value}) historicamente marca bons pontos de acumulação`);
    } else if (fearGreed.value >= 75) {
      score -= 1;
      reasons.push(`Ganância extrema (${fearGreed.value}) costuma anteceder correções`);
    } else {
      reasons.push(`Sentimento: ${fearGreed.classification} (${fearGreed.value}/100)`);
    }
  }

  let stance = 'hold';
  if (score >= 1) stance = 'accumulate';
  if (score <= -1) stance = 'caution';

  return { stance, score, reasons };
};
