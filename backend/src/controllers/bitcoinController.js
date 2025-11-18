import * as binanceService from '../services/binanceService.js';

/**
 * Controller: Retorna preço atual do Bitcoin
 */
export const getCurrentPrice = async (req, res) => {
  try {
    const data = await binanceService.getCurrentPrice();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preço atual',
      error: error.message
    });
  }
};

/**
 * Controller: Retorna histórico de preços
 */
export const getPriceHistory = async (req, res) => {
  try {
    const { period = '7' } = req.query;

    let days = parseInt(period);
    if (period === 'max') {
      days = 'max';
    }

    const config = binanceService.getIntervalConfig(days);
    const data = await binanceService.getPriceHistory(config.interval, config.limit);

    res.json({
      success: true,
      period: period,
      dataPoints: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
};

/**
 * Controller: Retorna estatísticas gerais do mercado
 */
export const getMarketStats = async (req, res) => {
  try {
    const currentPrice = await binanceService.getCurrentPrice();

    // Você pode adicionar mais dados aqui (de outras fontes, do banco, etc)
    const stats = {
      currentPrice: currentPrice.price,
      change24h: currentPrice.change24h,
      high24h: currentPrice.high24h,
      low24h: currentPrice.low24h,
      volume24h: currentPrice.volume24h,
      // Dados estáticos por enquanto (podem vir do banco depois)
      targetPrice2025: 140000,
      resistance: 115000,
      sentiment: 'Alta'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
};

/**
 * Controller: Retorna preço atual do Ethereum
 */
export const getEthereumPrice = async (req, res) => {
  try {
    const data = await binanceService.getEthereumPrice();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preço do Ethereum',
      error: error.message
    });
  }
};

/**
 * Controller: Retorna dados gerais do mercado
 */
export const getMarketOverview = async (req, res) => {
  try {
    const data = await binanceService.getMarketOverview();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do mercado',
      error: error.message
    });
  }
};

/**
 * Controller: Health check da API
 */
export const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'API Bitcoin Analysis está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};
