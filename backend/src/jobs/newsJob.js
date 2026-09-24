import cron from 'node-cron';
import * as newsService from '../services/newsService.js';

const runUpdate = async (reason) => {
  const startedAt = Date.now();
  try {
    const news = await newsService.refreshNews();
    const okSources = news.sources.filter((s) => s.ok).length;
    console.log(
      `[Notícias] ${reason}: ${news.items.length} notícias de ${okSources}/${news.sources.length} fontes ` +
      `em ${((Date.now() - startedAt) / 1000).toFixed(1)}s. Próxima: ${new Date(news.nextUpdateAt).toLocaleString('pt-BR', { timeZone: newsService.NEWS_SCHEDULE.timezone })}`
    );
  } catch (error) {
    console.error('[Notícias] Falha na atualização:', error.message);
  }
};

/**
 * Rotina que atualiza a aba "Notícias relevantes" todo dia às 09:00 e 18:00 (Brasília)
 */
export const startNewsJob = async () => {
  const { cron: expression, timezone } = newsService.NEWS_SCHEDULE;

  cron.schedule(expression, () => runUpdate('Atualização agendada'), { timezone });
  console.log(`[Notícias] Rotina agendada: "${expression}" (${timezone})`);

  // Se o servidor ficou desligado durante um horário agendado, atualiza agora
  const saved = await newsService.loadNewsFromDisk();
  if (newsService.isNewsStale(saved)) {
    runUpdate('Atualização inicial');
  }
};
