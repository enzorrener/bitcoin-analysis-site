import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para logging de requisições (desenvolvimento)
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de respostas
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Serviço: Buscar preço atual do Bitcoin
 */
export const getCurrentPrice = async () => {
  try {
    const response = await api.get('/bitcoin/price');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar preço atual:', error);
    throw error;
  }
};

/**
 * Serviço: Buscar histórico de preços
 * @param {string} period - Período: 7, 30, 90, 365, max
 */
export const getPriceHistory = async (period = '7') => {
  try {
    const response = await api.get('/bitcoin/history', {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
};

/**
 * Serviço: Buscar estatísticas do mercado
 */
export const getMarketStats = async () => {
  try {
    const response = await api.get('/bitcoin/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
};

export default api;
