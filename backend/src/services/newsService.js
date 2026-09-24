import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Arquivo onde a última coleta fica salva (sobrevive a reinícios do servidor)
export const NEWS_FILE = process.env.NEWS_FILE || path.resolve(__dirname, '../../data/news.json');

/**
 * Horários da rotina de atualização (horário de Brasília)
 */
export const NEWS_SCHEDULE = {
  hours: [9, 18],
  timezone: 'America/Sao_Paulo',
  cron: '0 9,18 * * *'
};

/**
 * Fontes de notícias (RSS). Foco em portais brasileiros + referências internacionais.
 * Cada fonte pode ter endereços alternativos: a coleta usa o primeiro que responder.
 */
export const NEWS_SOURCES = [
  { id: 'portal-do-bitcoin', name: 'Portal do Bitcoin', urls: ['https://portaldobitcoin.uol.com.br/feed/'], lang: 'pt' },
  { id: 'livecoins', name: 'Livecoins', urls: ['https://livecoins.com.br/feed/'], lang: 'pt' },
  { id: 'criptofacil', name: 'CriptoFácil', urls: ['https://www.criptofacil.com/feed/'], lang: 'pt' },
  { id: 'beincrypto-br', name: 'BeInCrypto Brasil', urls: ['https://br.beincrypto.com/feed/'], lang: 'pt' },
  { id: 'cointelegraph-br', name: 'Cointelegraph Brasil', urls: ['https://cointelegraph.com.br/rss', 'https://br.cointelegraph.com/rss'], lang: 'pt' },
  {
    id: 'money-times',
    name: 'Money Times',
    urls: ['https://www.moneytimes.com.br/criptomoedas/feed/', 'https://www.moneytimes.com.br/tag/criptomoedas/feed/'],
    lang: 'pt'
  },
  { id: 'coindesk', name: 'CoinDesk', urls: ['https://www.coindesk.com/arc/outboundfeeds/rss/'], lang: 'en' },
  { id: 'decrypt', name: 'Decrypt', urls: ['https://decrypt.co/feed'], lang: 'en' }
];

// Público do site é brasileiro: notícias em português ganham prioridade
const LANG_BOOST = { pt: 1.3, en: 1 };

const MAX_ITEMS = 30;
const MAX_AGE_HOURS = 72;
const HALF_LIFE_HOURS = 24;

/**
 * Categorias e palavras-chave (sem acento, minúsculas)
 */
const CATEGORIES = [
  {
    name: 'Regulação',
    terms: ['regulacao', 'regulament', 'cvm', ' sec ', 'banco central', 'bacen', 'projeto de lei', 'imposto', 'receita federal', 'tributa', 'regulation', 'regulator', 'lawsuit', 'congress', 'senado', ' mica ', 'stablecoin bill', 'justica']
  },
  {
    name: 'Macroeconomia',
    terms: [' fed ', 'federal reserve', 'juros', 'inflacao', ' cpi ', ' ipc ', 'powell', 'selic', 'copom', 'dolar', 'treasury', 'rate cut', 'recessao', 'recession', ' pib ', 'payroll', 'tarifa', 'tariff', 'macro']
  },
  {
    name: 'ETFs e Institucional',
    terms: ['etf', 'blackrock', 'fidelity', 'institucion', 'grayscale', 'vanguard', 'tesouraria', 'treasury company', 'strategy', 'microstrategy', 'saylor', ' fundo', 'bank', 'banco']
  },
  {
    name: 'Segurança',
    terms: ['hack', 'golpe', 'fraude', 'exploit', 'roubo', 'scam', 'ataque', 'piramide', 'phishing', 'vulnerab']
  },
  {
    name: 'Altcoins',
    terms: ['ethereum', ' eth ', 'solana', 'xrp', 'ripple', 'cardano', 'bnb', 'dogecoin', 'doge', 'altcoin', 'memecoin', ' tron ', 'avalanche', 'polkadot', 'chainlink', 'shiba', 'toncoin', ' sui ']
  },
  {
    name: 'Bitcoin',
    terms: ['bitcoin', 'btc', 'satoshi', 'halving', 'minerac', 'mineradora', 'miner', 'hashrate', 'lightning']
  }
];

/**
 * Peso de relevância por termo (título vale mais que a descrição)
 */
const RELEVANCE_TERMS = [
  ['bitcoin', 4], ['btc', 3], ['etf', 3], ['recorde', 2.5], ['record', 2.5], ['maxima historica', 2.5],
  ['all-time high', 2.5], [' fed ', 2.5], ['juros', 2.5], ['selic', 2], [' sec ', 2.5], ['cvm', 2.5],
  ['regula', 2], ['blackrock', 2], ['ethereum', 2], ['halving', 2], ['stablecoin', 1.5], ['drex', 1.5],
  ['reserva estrategica', 2.5], ['strategic reserve', 2.5], ['hack', 1.5], ['inflacao', 1.5],
  ['institucion', 1.5], ['solana', 1], ['xrp', 1], ['queda', 1], ['alta', 0.5], ['crash', 1.5], ['rally', 1]
];

// Conteúdo patrocinado perde relevância
const PENALTY_TERMS = ['patrocinado', 'publieditorial', 'press release', 'sponsored', 'cupom', 'airdrop gratis', 'bonus de cadastro'];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  processEntities: true,
  htmlEntities: true
});

const HTML_ENTITIES = {
  '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>',
  '&hellip;': '…', '&ndash;': '–', '&mdash;': '—', '&lsquo;': '‘', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”'
};

// Acentos em entidades nomeadas (&aacute; &ccedil; &atilde; ...)
const ACCENT_MARKS = { acute: '\u0301', grave: '\u0300', circ: '\u0302', tilde: '\u0303', uml: '\u0308', cedil: '\u0327' };

const decodeEntities = (text) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z])(acute|grave|circ|tilde|uml|cedil);/gi, (_, letter, mark) => `${letter}${ACCENT_MARKS[mark.toLowerCase()]}`.normalize('NFC'))
    .replace(/&[a-z]+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity);

const toText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return toText(value[0]);
  if (typeof value === 'object') return toText(value['#text'] ?? value['@_href'] ?? '');
  return '';
};

const stripHtml = (html) =>
  decodeEntities(
    decodeEntities(toText(html))
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

const normalize = (text) =>
  ` ${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9$\- ]/g, ' ')
    .replace(/\s+/g, ' ')} `;

const truncate = (text, max = 240) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trim()}…`;
};

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

const toHttps = (url) => (typeof url === 'string' && url.startsWith('http') ? url.replace(/^http:\/\//, 'https://') : null);

/**
 * Tenta encontrar a imagem de capa da notícia em vários formatos de RSS
 */
const extractImage = (item) => {
  const candidates = [
    ...asArray(item['media:content']).map((m) => m?.['@_url']),
    ...asArray(item['media:thumbnail']).map((m) => m?.['@_url']),
    ...asArray(item['media:group']?.['media:content']).map((m) => m?.['@_url']),
    ...asArray(item.enclosure)
      .filter((e) => !e?.['@_type'] || e['@_type'].startsWith('image'))
      .map((e) => e?.['@_url'])
  ];

  const html = `${toText(item['content:encoded'])} ${toText(item.description)} ${toText(item.content)}`;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) candidates.push(imgMatch[1]);

  return candidates.map(toHttps).find(Boolean) || null;
};

const extractLink = (item) => {
  if (typeof item.link === 'string') return item.link;
  const links = asArray(item.link);
  const alternate = links.find((l) => l?.['@_rel'] === 'alternate') || links[0];
  return alternate?.['@_href'] || toText(alternate) || toText(item.guid);
};

const classify = (normalizedText) => {
  const scores = CATEGORIES.map((category) => ({
    name: category.name,
    hits: category.terms.filter((term) => normalizedText.includes(term)).length
  }));
  const best = scores.reduce((a, b) => (b.hits > a.hits ? b : a), { name: null, hits: 0 });
  return best.name;
};

const keywordScore = (title, description) => {
  let score = 0;
  for (const [term, weight] of RELEVANCE_TERMS) {
    if (title.includes(term)) score += weight * 1.5;
    else if (description.includes(term)) score += weight * 0.5;
  }
  if (PENALTY_TERMS.some((term) => title.includes(term) || description.includes(term))) {
    score -= 6;
  }
  return score;
};

/**
 * Converte o XML de um feed (RSS 2.0 ou Atom) em notícias normalizadas
 */
export const parseFeed = (xml, source) => {
  const doc = parser.parse(xml);
  const rawItems = asArray(doc?.rss?.channel?.item ?? doc?.feed?.entry ?? doc?.['rdf:RDF']?.item);

  return rawItems
    .map((item) => {
      const title = stripHtml(item.title);
      const link = extractLink(item);
      const rawDate = toText(item.pubDate ?? item.published ?? item.updated ?? item['dc:date']);
      const publishedAt = rawDate ? new Date(rawDate) : null;
      const description = truncate(
        stripHtml(item.description ?? item.summary ?? item['content:encoded'] ?? item.content)
      );

      // Aceita apenas links http(s) (evita javascript: e similares vindos do feed)
      if (!title || !/^https?:\/\//i.test(link?.trim() || '') || !publishedAt || Number.isNaN(publishedAt.getTime())) return null;

      return {
        id: `${source.id}-${Buffer.from(link).toString('base64url').slice(-24)}`,
        title,
        description,
        url: link.trim(),
        image: extractImage(item),
        source: source.name,
        sourceId: source.id,
        lang: source.lang,
        publishedAt: publishedAt.toISOString()
      };
    })
    .filter(Boolean);
};

const tokens = (text) => new Set(normalize(text).split(' ').filter((word) => word.length > 3));

const similarity = (a, b) => {
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Pontua, classifica, remove duplicadas e seleciona as notícias mais relevantes
 */
export const rankNews = (items, now = new Date()) => {
  const scored = items
    .map((item) => {
      const title = normalize(item.title);
      const description = normalize(item.description);
      const ageHours = Math.max(0, (now - new Date(item.publishedAt)) / 36e5);
      const relevance = keywordScore(title, description);
      const recency = 0.5 ** (ageHours / HALF_LIFE_HOURS) * (LANG_BOOST[item.lang] || 1);

      return {
        ...item,
        category: classify(title) || classify(description) || 'Mercado',
        ageHours,
        score: Number(((1 + Math.max(relevance, 0)) * recency + (relevance < 0 ? relevance : 0)).toFixed(3))
      };
    })
    // Descarta conteúdo patrocinado e datas no futuro (fuso errado no feed) além de 1h
    .filter((item) => item.score > 0 && new Date(item.publishedAt) - now < 36e5)
    .sort((a, b) => b.score - a.score);

  // Remove duplicadas (mesma notícia em portais diferentes)
  const unique = [];
  for (const item of scored) {
    const itemTokens = tokens(item.title);
    const duplicate = unique.find((kept) => similarity(kept.tokens, itemTokens) >= 0.5);
    if (duplicate) {
      if (!duplicate.alsoReportedBy.includes(item.source) && duplicate.source !== item.source) {
        duplicate.alsoReportedBy.push(item.source);
      }
      // Aproveita imagem e resumo da outra fonte quando faltam na principal
      if (!duplicate.image && item.image) duplicate.image = item.image;
      if (item.description.length > duplicate.description.length) duplicate.description = item.description;
      continue;
    }
    unique.push({ ...item, tokens: itemTokens, alsoReportedBy: [] });
  }

  const recent = unique.filter((item) => item.ageHours <= MAX_AGE_HOURS);
  const pool = recent.length >= 12 ? recent : unique;

  return pool.slice(0, MAX_ITEMS).map(({ tokens: _tokens, ageHours: _age, ...item }) => ({
    ...item,
    // Notícias repercutidas por várias fontes ganham destaque
    score: Number((item.score * (1 + 0.25 * item.alsoReportedBy.length)).toFixed(3))
  })).sort((a, b) => b.score - a.score);
};

/**
 * Retorna as partes da data no fuso informado
 */
const zonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
};

/**
 * Lista os horários da rotina (em UTC) de ontem até amanhã
 */
const scheduleSlots = (now) => {
  const { timezone, hours } = NEWS_SCHEDULE;
  const p = zonedParts(now, timezone);
  const offsetMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(now.getTime() / 1000) * 1000;

  const slots = [];
  for (const dayShift of [-1, 0, 1]) {
    for (const hour of hours) {
      slots.push(new Date(Date.UTC(p.year, p.month - 1, p.day + dayShift, hour, 0, 0) - offsetMs));
    }
  }
  return slots.sort((a, b) => a - b);
};

/**
 * Próximo horário de atualização (09:00 ou 18:00 de Brasília)
 */
export const getNextUpdate = (now = new Date()) => scheduleSlots(now).find((slot) => slot > now);

/**
 * Último horário de atualização que já passou
 */
export const getLastScheduledUpdate = (now = new Date()) =>
  scheduleSlots(now).filter((slot) => slot <= now).pop();

const requestFeed = async (url) => {
  const { data } = await axios.get(url, {
    timeout: 15000,
    responseType: 'text',
    maxContentLength: 5 * 1024 * 1024,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BitcoinAnalysisBot/1.0; +https://github.com/enzorrener/bitcoin-analysis-site)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8'
    }
  });
  return data;
};

/**
 * Baixa um feed (tentando os endereços alternativos) e retorna as notícias dele
 */
const fetchSource = async (source) => {
  let lastError;
  for (const url of source.urls) {
    try {
      const items = parseFeed(await requestFeed(url), source);
      if (items.length > 0) return { url, items };
      lastError = new Error('Feed sem notícias');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

/**
 * Coleta todas as fontes e monta o conteúdo da aba "Notícias relevantes"
 */
export const collectNews = async (now = new Date()) => {
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));

  const sources = NEWS_SOURCES.map((source, index) => {
    const result = results[index];
    return {
      id: source.id,
      name: source.name,
      ok: result.status === 'fulfilled',
      count: result.status === 'fulfilled' ? result.value.items.length : 0,
      ...(result.status === 'fulfilled' && { url: result.value.url }),
      ...(result.status === 'rejected' && { error: result.reason?.message })
    };
  });

  const allItems = results.flatMap((result) => (result.status === 'fulfilled' ? result.value.items : []));
  const items = rankNews(allItems, now);

  return {
    updatedAt: now.toISOString(),
    nextUpdateAt: getNextUpdate(now).toISOString(),
    schedule: NEWS_SCHEDULE.hours.map((h) => `${String(h).padStart(2, '0')}:00`),
    timezone: NEWS_SCHEDULE.timezone,
    sources,
    items
  };
};

// ===== Armazenamento =====

let currentNews = null;
let refreshing = null;

export const loadNewsFromDisk = async () => {
  try {
    currentNews = JSON.parse(await fs.readFile(NEWS_FILE, 'utf-8'));
  } catch {
    currentNews = null;
  }
  return currentNews;
};

const saveNews = async (news) => {
  await fs.mkdir(path.dirname(NEWS_FILE), { recursive: true });
  const tmp = `${NEWS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(news, null, 2));
  await fs.rename(tmp, NEWS_FILE);
};

/**
 * Executa a coleta. Se nenhuma fonte responder, mantém as notícias anteriores.
 */
export const refreshNews = async () => {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const news = await collectNews();
    if (news.items.length === 0 && currentNews?.items?.length) {
      console.warn('Nenhuma notícia coletada. Mantendo a última atualização.');
      currentNews = { ...currentNews, nextUpdateAt: news.nextUpdateAt, lastAttemptAt: news.updatedAt, sources: news.sources };
    } else {
      currentNews = news;
    }
    await saveNews(currentNews);
    return currentNews;
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
};

/**
 * Retorna as notícias atuais (carrega do disco na primeira chamada)
 */
export const getNews = async () => {
  if (!currentNews) await loadNewsFromDisk();
  if (!currentNews) return refreshNews();
  return { ...currentNews, nextUpdateAt: getNextUpdate().toISOString() };
};

/**
 * Indica se as notícias salvas são anteriores ao último horário agendado
 */
export const isNewsStale = (news = currentNews, now = new Date()) => {
  if (!news?.updatedAt) return true;
  return new Date(news.updatedAt) < getLastScheduledUpdate(now);
};
