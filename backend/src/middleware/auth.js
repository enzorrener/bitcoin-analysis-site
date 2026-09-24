import { verifyToken } from '../services/authService.js';

/**
 * Middleware que exige um token JWT válido no header Authorization
 */
export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Token de acesso não informado' });
  }

  try {
    req.user = await verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Sessão inválida ou expirada' });
  }
};
