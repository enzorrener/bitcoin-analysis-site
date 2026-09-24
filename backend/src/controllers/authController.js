import * as authService from '../services/authService.js';

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof authService.AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      field: error.field
    });
  }
  console.error(fallbackMessage, error);
  res.status(500).json({ success: false, message: fallbackMessage });
};

/**
 * Controller: Cadastro de usuário
 */
export const register = async (req, res) => {
  try {
    const data = await authService.register(req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Erro ao criar conta');
  }
};

/**
 * Controller: Login
 */
export const login = async (req, res) => {
  try {
    const data = await authService.login(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Erro ao entrar');
  }
};

/**
 * Controller: Dados do usuário autenticado
 */
export const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
