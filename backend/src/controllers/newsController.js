import * as newsService from '../services/newsService.js';

/**
 * Controller: Notícias relevantes (atualizadas às 09:00 e 18:00 de Brasília)
 */
export const getNews = async (req, res) => {
  try {
    const data = await newsService.getNews();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notícias',
      error: error.message
    });
  }
};
