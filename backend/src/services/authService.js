import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userService from './userService.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const resolveSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET precisa ser definido em produção');
  }
  console.warn('JWT_SECRET não definido: usando chave temporária (sessões expiram ao reiniciar o servidor)');
  return crypto.randomBytes(32).toString('hex');
};

const JWT_SECRET = resolveSecret();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Hash usado quando o e-mail não existe, para o tempo de resposta ser o mesmo
const DUMMY_HASH = bcrypt.hashSync('usuario-inexistente', 10);

/**
 * Erro de validação com status HTTP
 */
class AuthError extends Error {
  constructor(message, statusCode = 400, field) {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
  }
}

export { AuthError };

/**
 * Remove dados sensíveis antes de enviar ao cliente
 */
export const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  displayName: user.displayName || null,
  email: user.email,
  avatar: user.avatar || null,
  banner: user.banner || null,
  createdAt: user.createdAt
});

const signToken = (user) =>
  jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const validateRegistration = ({ name, email, password }) => {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (cleanName.length < 2 || cleanName.length > 120) {
    throw new AuthError('Informe seu nome (mínimo de 2 caracteres).', 400, 'name');
  }
  if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 255) {
    throw new AuthError('Informe um e-mail válido.', 400, 'email');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new AuthError('A senha deve ter entre 8 e 128 caracteres.', 400, 'password');
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AuthError('A senha deve conter letras e números.', 400, 'password');
  }

  return { name: cleanName, email: cleanEmail, password };
};

/**
 * Cadastra um novo usuário e já retorna o token de acesso
 */
export const register = async (payload) => {
  const { name, email, password } = validateRegistration(payload);

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await userService.createUser({ name, email, passwordHash });
    return { token: signToken(user), user: toPublicUser(user) };
  } catch (error) {
    if (error.code === 'EMAIL_IN_USE') {
      throw new AuthError('Este e-mail já está cadastrado.', 409, 'email');
    }
    throw error;
  }
};

/**
 * Autentica com e-mail e senha
 */
export const login = async ({ email, password }) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanEmail || typeof password !== 'string' || !password) {
    throw new AuthError('Preencha e-mail e senha.');
  }

  const user = await userService.findUserByEmail(cleanEmail);
  // Compara mesmo sem usuário para não revelar quais e-mails existem pelo tempo de resposta
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !valid) {
    throw new AuthError('E-mail ou senha incorretos.', 401);
  }

  return { token: signToken(user), user: toPublicUser(user) };
};

/**
 * Valida o token JWT e retorna o usuário
 */
export const verifyToken = async (token) => {
  const payload = jwt.verify(token, JWT_SECRET);
  const user = await userService.findUserById(payload.sub);
  if (!user) {
    throw new AuthError('Usuário não encontrado.', 401);
  }
  return toPublicUser(user);
};

// ===== Perfil =====

const IMAGE_REGEX = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const BANNER_PRESET_REGEX = /^preset:[a-z-]{1,24}$/;
const MAX_AVATAR_LENGTH = 400 * 1024;   // ~300 KB de imagem
const MAX_BANNER_LENGTH = 1500 * 1024;  // ~1,1 MB de imagem

/**
 * Valida imagem enviada como data URL (null ou '' remove a imagem)
 */
const validateImage = (value, maxLength, field, allowPreset = false) => {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new AuthError('Imagem inválida.', 400, field);
  if (allowPreset && BANNER_PRESET_REGEX.test(value)) return value;
  if (!IMAGE_REGEX.test(value)) throw new AuthError('Use uma imagem PNG, JPG ou WEBP.', 400, field);
  if (value.length > maxLength) throw new AuthError('Imagem muito grande. Escolha um arquivo menor.', 400, field);
  return value;
};

const checkPassword = async (user, currentPassword) => {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new AuthError('Informe sua senha atual para confirmar.', 400, 'currentPassword');
  }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AuthError('Senha atual incorreta.', 401, 'currentPassword');
  }
};

/**
 * Atualiza nome, "como quer ser chamado", e-mail, foto e banner.
 * Trocar o e-mail exige a senha atual.
 */
export const updateProfile = async (userId, payload = {}) => {
  const user = await userService.findUserById(userId);
  if (!user) throw new AuthError('Usuário não encontrado.', 404);

  const changes = {};

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (name.length < 2 || name.length > 120) {
      throw new AuthError('Informe seu nome (mínimo de 2 caracteres).', 400, 'name');
    }
    changes.name = name;
  }

  if (payload.displayName !== undefined) {
    const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : '';
    if (displayName.length > 60) {
      throw new AuthError('O apelido pode ter no máximo 60 caracteres.', 400, 'displayName');
    }
    changes.displayName = displayName || null;
  }

  if (payload.email !== undefined) {
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      throw new AuthError('Informe um e-mail válido.', 400, 'email');
    }
    if (email !== user.email) {
      await checkPassword(user, payload.currentPassword);
      changes.email = email;
    }
  }

  if (payload.avatar !== undefined) {
    changes.avatar = validateImage(payload.avatar, MAX_AVATAR_LENGTH, 'avatar');
  }

  if (payload.banner !== undefined) {
    changes.banner = validateImage(payload.banner, MAX_BANNER_LENGTH, 'banner', true);
  }

  try {
    const updated = await userService.updateUser(userId, changes);
    return toPublicUser(updated);
  } catch (error) {
    if (error.code === 'EMAIL_IN_USE') {
      throw new AuthError('Este e-mail já está cadastrado.', 409, 'email');
    }
    throw error;
  }
};

/**
 * Troca a senha (exige a senha atual)
 */
export const changePassword = async (userId, { currentPassword, newPassword } = {}) => {
  const user = await userService.findUserById(userId);
  if (!user) throw new AuthError('Usuário não encontrado.', 404);

  await checkPassword(user, currentPassword);

  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    throw new AuthError('A nova senha deve ter entre 8 e 128 caracteres.', 400, 'newPassword');
  }
  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new AuthError('A nova senha deve conter letras e números.', 400, 'newPassword');
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new AuthError('A nova senha deve ser diferente da atual.', 400, 'newPassword');
  }

  await userService.updateUser(userId, { passwordHash: await bcrypt.hash(newPassword, 10) });
};
