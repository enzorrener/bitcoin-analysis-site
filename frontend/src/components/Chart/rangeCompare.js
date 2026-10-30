/**
 * Comparação entre dois pontos do gráfico (segurar o botão esquerdo e arrastar).
 *
 * O componente guarda a seleção em chart.$compare = { start, end, up } e chama
 * chart.draw(); este plugin desenha a faixa destacada, as linhas verticais e os
 * marcadores nos dois pontos comparados.
 */

const COLORS = {
  up: { fill: 'rgba(22, 199, 132, 0.12)', line: 'rgba(22, 199, 132, 0.9)', dot: '#16c784' },
  down: { fill: 'rgba(234, 57, 67, 0.12)', line: 'rgba(234, 57, 67, 0.9)', dot: '#ea3943' },
  neutral: { fill: 'rgba(139, 149, 167, 0.1)', line: 'rgba(139, 149, 167, 0.8)', dot: '#8b95a7' }
};

const paletteFor = (selection) => {
  if (selection.start === selection.end) return COLORS.neutral;
  return selection.up ? COLORS.up : COLORS.down;
};

const verticalLine = (ctx, x, top, bottom) => {
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.stroke();
};

export const rangeComparePlugin = {
  id: 'rangeCompare',

  beforeDatasetsDraw(chart) {
    const selection = chart.$compare;
    if (!selection) return;

    const { ctx, chartArea, scales } = chart;
    const colors = paletteFor(selection);
    const x1 = scales.x.getPixelForValue(Math.min(selection.start, selection.end));
    const x2 = scales.x.getPixelForValue(Math.max(selection.start, selection.end));

    ctx.save();
    ctx.fillStyle = colors.fill;
    ctx.fillRect(x1, chartArea.top, x2 - x1, chartArea.bottom - chartArea.top);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    verticalLine(ctx, x1, chartArea.top, chartArea.bottom);
    if (x2 !== x1) verticalLine(ctx, x2, chartArea.top, chartArea.bottom);
    ctx.restore();
  },

  afterDatasetsDraw(chart) {
    const selection = chart.$compare;
    if (!selection) return;

    const points = chart.getDatasetMeta(0)?.data || [];
    const colors = paletteFor(selection);
    const { ctx } = chart;

    ctx.save();
    [selection.start, selection.end].forEach((index) => {
      const point = points[index];
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.dot;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
    ctx.restore();
  }
};

/**
 * Converte a posição do ponteiro em índice do eixo X (limitado à área do gráfico)
 */
export const indexFromClientX = (chart, clientX, length) => {
  if (!chart?.chartArea || !length) return null;
  const rect = chart.canvas.getBoundingClientRect();
  const { left, right } = chart.chartArea;
  const x = Math.min(Math.max(clientX - rect.left, left), right);
  const index = Math.round(chart.scales.x.getValueForPixel(x));
  return Math.min(Math.max(index, 0), length - 1);
};

/**
 * Duração legível entre dois instantes (ex: 6 dias e 4 h, 3 h 15 min)
 */
export const formatDuration = (ms) => {
  const minutes = Math.round(Math.abs(ms) / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days >= 60) {
    const months = Math.round(days / 30.4);
    return months >= 24 ? `${(days / 365).toFixed(1).replace('.', ',')} anos` : `${months} meses`;
  }
  if (days > 0) return hours > 0 && days < 7 ? `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} h` : `${days} ${days === 1 ? 'dia' : 'dias'}`;
  if (hours > 0) return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  return `${mins} min`;
};
