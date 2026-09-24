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
  email: user.email,
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
