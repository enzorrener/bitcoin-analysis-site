const LOCALE = 'pt-BR';
const TIMEZONE = 'America/Sao_Paulo';

const currencyFormatters = new Map();

const getCurrencyFormatter = (currency, options) => {
  const key = `${currency}-${JSON.stringify(options)}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(key, new Intl.NumberFormat(LOCALE, { style: 'currency', currency, ...options }));
  }
  return currencyFormatters.get(key);
};

/**
 * Casas decimais adaptadas ao tamanho do valor (BTC x SHIB)
 */
const decimalsFor = (value) => {
  const abs = Math.abs(value);
  if (abs >= 1) return { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (abs >= 0.01) return { minimumFractionDigits: 4, maximumFractionDigits: 4 };
  return { maximumSignificantDigits: 4 };
};

/**
 * Formata número para moeda (USD por padrão)
 * @param {number} value
 * @param {string} currency - 'USD' ou 'BRL'
 * @param {object} options - { decimals: false } para arredondar
 */
export const formatCurrency = (value, currency = 'USD', options = {}) => {
  if (value == null || Number.isNaN(value)) return '—';
  const digits = options.decimals === false
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : decimalsFor(value);
  return getCurrencyFormatter(currency, digits).format(value);
};

/**
 * Formata valores grandes de forma compacta (ex: US$ 2,3 tri)
 */
export const formatCompactCurrency = (value, currency = 'USD') => {
  if (value == null || Number.isNaN(value)) return '—';
  return getCurrencyFormatter(currency, { notation: 'compact', maximumFractionDigits: 2 }).format(value);
};

/**
 * Formata número com separador de milhares
 */
export const formatNumber = (value, maximumFractionDigits = 2) => {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
};

/**
 * Formata porcentagem
 */
export const formatPercentage = (value, digits = 2) => {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
};

/**
 * Formata data para exibição
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Formata data e hora
 */
export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Hora no horário de Brasília (ex: 18:00)
 */
export const formatBrasiliaTime = (date) =>
  new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }).format(new Date(date));

/**
 * Data curta + hora no horário de Brasília (ex: 24/09 às 18:00)
 */
export const formatBrasiliaDateTime = (date) => {
  const d = new Date(date);
  const day = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', timeZone: TIMEZONE }).format(d);
  return `${day} às ${formatBrasiliaTime(d)}`;
};

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });

/**
 * Tempo relativo (ex: há 2 h, há 3 dias)
 */
export const formatRelativeTime = (date, now = Date.now()) => {
  const diffSeconds = Math.round((new Date(date).getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return 'agora';
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour');
  return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day');
};

/**
 * Contagem regressiva (ex: 3h 12min)
 */
export const formatCountdown = (target, now = Date.now()) => {
  const diff = Math.max(0, new Date(target).getTime() - now);
  const hours = Math.floor(diff / 36e5);
  const minutes = Math.floor((diff % 36e5) / 6e4);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
};

/**
 * Retorna nome do mês por extenso
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
};

/**
 * Formata data completa para o relatório
 */
export const formatReportDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const monthName = getMonthName(now.getMonth());
  const year = now.getFullYear();

  return `Relatório de Mercado • ${day} de ${monthName} de ${year}`;
};
