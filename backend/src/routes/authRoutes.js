import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Limite mais rígido para evitar tentativas de força bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Aguarde alguns minutos.' }
});

/**
 * @route   POST /api/auth/register
 * @desc    Cria uma conta (name, email, password)
 * @access  Public
 */
router.post('/register', authLimiter, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Autentica com email e password
 * @access  Public
 */
router.post('/login', authLimiter, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Retorna o usuário do token
 * @access  Private
 */
router.get('/me', requireAuth, authController.me);

/**
 * @route   PUT /api/auth/me
 * @desc    Atualiza nome, apelido, e-mail (exige currentPassword), foto e banner
 * @access  Private
 */
router.put('/me', requireAuth, authController.updateMe);

/**
 * @route   PUT /api/auth/password
 * @desc    Troca a senha (currentPassword, newPassword)
 * @access  Private
 */
router.put('/password', authLimiter, requireAuth, authController.changePassword);

export default router;
