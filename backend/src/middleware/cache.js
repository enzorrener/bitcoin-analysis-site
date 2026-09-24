/**
 * Define o header Cache-Control para respostas públicas (reduz requisições repetidas)
 * @param {number} seconds - Tempo de cache no navegador
 */
export const cacheFor = (seconds) => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
  next();
};
