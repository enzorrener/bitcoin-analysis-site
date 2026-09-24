/**
 * Autenticação.
 *
 * Modo backend: usa /api/auth (senha com bcrypt e token JWT no servidor).
 * Modo estático (GitHub Pages, sem servidor): a conta fica salva apenas neste
 * navegador, com a senha protegida por PBKDF2 (Web Crypto).
 */
import { backendRequest, isStaticMode } from './api';

const USERS_KEY = 'ba_local_users';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isLocalAuth = isStaticMode;

export class AuthError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

/**
 * Mesmas regras do backend
 */
export const validateRegistration = ({ name, email, password }) => {
  if (!name || name.trim().length < 2) throw new AuthError('Informe seu nome (mínimo de 2 caracteres).', 'name');
  if (!EMAIL_REGEX.test(email.trim())) throw new AuthError('Informe um e-mail válido.', 'email');
  if (password.length < 8) throw new AuthError('A senha deve ter pelo menos 8 caracteres.', 'password');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AuthError('A senha deve conter letras e números.', 'password');
  }
};

// ===== Modo local (navegador) =====

const toHex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

const hashPassword = async (password, saltHex) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 150000 }, key, 256);
  return toHex(bits);
};

const readLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
};

const publicUser = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

const localRegister = async ({ name, email, password }) => {
  const users = readLocalUsers();
  if (users.some((user) => user.email === email)) {
    throw new AuthError('Este e-mail já está cadastrado neste navegador.', 'email');
  }

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : toHex(crypto.getRandomValues(new Uint8Array(16))),
    name,
    email,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return { token: `local:${user.id}`, user: publicUser(user) };
};

const localLogin = async ({ email, password }) => {
  const user = readLocalUsers().find((u) => u.email === email);
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
    throw new AuthError('E-mail ou senha incorretos.');
  }
  return { token: `local:${user.id}`, user: publicUser(user) };
};

const localMe = async (token) => {
  const id = token.replace(/^local:/, '');
  const user = readLocalUsers().find((u) => u.id === id);
  if (!user) throw new AuthError('Sessão expirada.');
  return publicUser(user);
};

// ===== Modo backend =====

const toAuthError = (error) => {
  if (error.status === 0 || (error.status >= 500 && !error.body?.message)) {
    return new AuthError('Servidor indisponível. Verifique se o backend está rodando.');
  }
  return new AuthError(error.body?.message || error.message, error.body?.field);
};

const post = async (path, body) => {
  try {
    return await backendRequest(path, { method: 'POST', body: JSON.stringify(body) });
  } catch (error) {
    throw toAuthError(error);
  }
};

// ===== API =====

/**
 * Cria a conta e retorna { token, user }
 */
export const register = async ({ name, email, password }) => {
  const payload = { name: name.trim(), email: email.trim().toLowerCase(), password };
  validateRegistration(payload);
  return isLocalAuth ? localRegister(payload) : post('/auth/register', payload);
};

/**
 * Entra com e-mail e senha e retorna { token, user }
 */
export const login = async ({ email, password }) => {
  const payload = { email: email.trim().toLowerCase(), password };
  if (!payload.email || !password) throw new AuthError('Preencha e-mail e senha.');
  return isLocalAuth ? localLogin(payload) : post('/auth/login', payload);
};

/**
 * Valida o token salvo e retorna o usuário
 */
export const fetchCurrentUser = async (token) => {
  if (token.startsWith('local:')) return localMe(token);
  try {
    const data = await backendRequest('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    return data.user;
  } catch (error) {
    throw toAuthError(error);
  }
};
