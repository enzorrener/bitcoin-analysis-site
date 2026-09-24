import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = process.env.USERS_FILE || path.resolve(__dirname, '../../data/users.json');

// 'postgres' quando o banco está disponível, senão 'file' (JSON local)
let storage = 'file';
let writeQueue = Promise.resolve();

/**
 * Define onde os usuários serão salvos e cria a tabela se necessário
 * @param {boolean} dbConnected - Resultado do teste de conexão com o PostgreSQL
 */
export const initUserStore = async (dbConnected) => {
  if (dbConnected) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Campos do perfil (adicionados depois da primeira versão da tabela)
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS display_name VARCHAR(60),
        ADD COLUMN IF NOT EXISTS avatar TEXT,
        ADD COLUMN IF NOT EXISTS banner TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
    `);
    storage = 'postgres';
  } else {
    storage = 'file';
  }
  console.log(`Usuários armazenados em: ${storage === 'postgres' ? 'PostgreSQL' : USERS_FILE}`);
  return storage;
};

const readUsersFile = async () => {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeUsersFile = async (users) => {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  const tmp = `${USERS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(users, null, 2));
  await fs.rename(tmp, USERS_FILE);
};

const fromRow = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash ?? row.passwordHash,
    displayName: row.display_name ?? row.displayName ?? null,
    avatar: row.avatar ?? null,
    banner: row.banner ?? null,
    createdAt: new Date(row.created_at ?? row.createdAt).toISOString()
  };

export const findUserByEmail = async (email) => {
  if (storage === 'postgres') {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return fromRow(rows[0]);
  }
  const users = await readUsersFile();
  return fromRow(users.find((user) => user.email === email));
};

export const findUserById = async (id) => {
  if (storage === 'postgres') {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return fromRow(rows[0]);
  }
  const users = await readUsersFile();
  return fromRow(users.find((user) => user.id === id));
};

/**
 * Cria um usuário. Lança erro com code 'EMAIL_IN_USE' se o e-mail já existir.
 */
export const createUser = async ({ name, email, passwordHash }) => {
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  if (storage === 'postgres') {
    try {
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
        [user.id, user.name, user.email, user.passwordHash, user.createdAt]
      );
    } catch (error) {
      if (error.code === '23505') {
        const conflict = new Error('E-mail já cadastrado');
        conflict.code = 'EMAIL_IN_USE';
        throw conflict;
      }
      throw error;
    }
    return user;
  }

  // Escritas em fila para evitar condição de corrida no arquivo
  const task = writeQueue.then(async () => {
    const users = await readUsersFile();
    if (users.some((existing) => existing.email === email)) {
      const conflict = new Error('E-mail já cadastrado');
      conflict.code = 'EMAIL_IN_USE';
      throw conflict;
    }
    users.push(user);
    await writeUsersFile(users);
    return user;
  });
  writeQueue = task.catch(() => {});
  return task;
};

const emailInUse = () => {
  const conflict = new Error('E-mail já cadastrado');
  conflict.code = 'EMAIL_IN_USE';
  return conflict;
};

// Campos que podem ser alterados e a coluna correspondente no PostgreSQL
const UPDATABLE = {
  name: 'name',
  email: 'email',
  displayName: 'display_name',
  avatar: 'avatar',
  banner: 'banner',
  passwordHash: 'password_hash'
};

/**
 * Atualiza os campos informados do usuário e retorna o usuário atualizado.
 * Lança erro com code 'EMAIL_IN_USE' se o novo e-mail já pertencer a outra conta.
 */
export const updateUser = async (id, changes) => {
  const fields = Object.keys(changes).filter((key) => key in UPDATABLE);
  if (fields.length === 0) return findUserById(id);

  if (storage === 'postgres') {
    const sets = fields.map((key, i) => `${UPDATABLE[key]} = $${i + 2}`);
    try {
      const { rows } = await pool.query(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...fields.map((key) => changes[key])]
      );
      return fromRow(rows[0]);
    } catch (error) {
      if (error.code === '23505') throw emailInUse();
      throw error;
    }
  }

  const task = writeQueue.then(async () => {
    const users = await readUsersFile();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    if (changes.email && users.some((user) => user.email === changes.email && user.id !== id)) {
      throw emailInUse();
    }
    fields.forEach((key) => {
      users[index][key] = changes[key];
    });
    users[index].updatedAt = new Date().toISOString();
    await writeUsersFile(users);
    return fromRow(users[index]);
  });
  writeQueue = task.catch(() => {});
  return task;
};
