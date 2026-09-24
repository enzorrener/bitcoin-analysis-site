import React, { memo, useMemo } from 'react';

/**
 * Mini gráfico em SVG puro (muito mais leve que um gráfico Chart.js por linha)
 */
const Sparkline = ({ data, width = 120, height = 36, strokeWidth = 1.6 }) => {
  const path = useMemo(() => {
    if (!data || data.length < 2) return null;
    // Reduz pontos para no máximo ~60
    const step = Math.max(1, Math.floor(data.length / 60));
    const points = data.filter((_, i) => i % step === 0 || i === data.length - 1);
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    return points
      .map((value, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - 2 - ((value - min) / range) * (height - 4);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!path) return <span style={{ display: 'inline-block', width, height }} />;

  const positive = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={positive ? 'var(--success)' : 'var(--danger)'} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default memo(Sparkline);
