/**
 * Gera o arquivo JSON da aba "Notícias relevantes".
 * Usado pela rotina do GitHub Actions (09:00 e 18:00 de Brasília) no deploy do site estático.
 *
 * Uso: node src/scripts/updateNews.js --out ../frontend/public/data/news.json [--fallback-url URL]
 */
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { collectNews } from '../services/newsService.js';

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const outFile = path.resolve(getArg('--out') || 'news.json');
const fallbackUrl = getArg('--fallback-url');

const main = async () => {
  let news = await collectNews();

  console.log('Fontes:');
  news.sources.forEach((source) => {
    console.log(`  ${source.ok ? 'OK   ' : 'FALHA'} ${source.name.padEnd(22)} ${String(source.count).padStart(3)} itens ${source.url || `(${source.error})`}`);
  });

  if (news.items.length === 0 && fallbackUrl) {
    console.warn(`Nenhuma notícia coletada. Reaproveitando a publicação anterior: ${fallbackUrl}`);
    try {
      const { data: previous } = await axios.get(fallbackUrl, { timeout: 15000 });
      if (previous?.items?.length) {
        news = { ...previous, nextUpdateAt: news.nextUpdateAt, lastAttemptAt: news.updatedAt, sources: news.sources };
      }
    } catch (error) {
      console.warn(`Não foi possível baixar a publicação anterior: ${error.message}`);
    }
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(news));

  console.log(`\n${news.items.length} notícias salvas em ${outFile}`);
  news.items.slice(0, 8).forEach((item, index) => {
    console.log(`  ${index + 1}. [${item.category}] ${item.title} (${item.source}, score ${item.score})`);
  });
};

main().catch((error) => {
  console.error('Erro ao gerar notícias:', error);
  process.exit(1);
});
