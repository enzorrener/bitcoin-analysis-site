import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';

const SESSION_KEY = 'ba_session';
const AuthContext = createContext(null);

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};

const writeSession = (session) => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Armazenamento indisponível
  }
};

/**
 * Sessão do usuário (login, cadastro e logout)
 */
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readSession);
  const [status, setStatus] = useState(session ? 'checking' : 'anonymous');

  // Confere se o token salvo ainda é válido
  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;

    authService
      .fetchCurrentUser(session.token)
      .then((user) => {
        if (cancelled) return;
        const next = { ...session, user };
        setSession(next);
        writeSession(next);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (cancelled) return;
        // Sem conexão com o servidor: mantém a sessão salva para não deslogar à toa
        if (error.message?.startsWith('Servidor indisponível')) {
          setStatus('authenticated');
          return;
        }
        setSession(null);
        writeSession(null);
        setStatus('anonymous');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = useCallback(({ token, user }) => {
    const next = { token, user };
    setSession(next);
    writeSession(next);
    setStatus('authenticated');
    return user;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession]);

  const register = useCallback(async (data) => startSession(await authService.register(data)), [startSession]);

  const updateProfile = useCallback(
    async (changes) => {
      const user = await authService.updateProfile(session.token, changes);
      const next = { ...session, user };
      setSession(next);
      writeSession(next);
      return user;
    },
    [session]
  );

  const changePassword = useCallback(
    (passwords) => authService.changePassword(session.token, passwords),
    [session]
  );

  const logout = useCallback(() => {
    setSession(null);
    writeSession(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      status,
      isAuthenticated: status === 'authenticated',
      isLocalAuth: authService.isLocalAuth,
      login,
      register,
      logout,
      updateProfile,
      changePassword
    }),
    [session, status, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
