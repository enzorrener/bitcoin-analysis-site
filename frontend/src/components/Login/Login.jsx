import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const redirectTo = location.state?.from || '/app';

  if (isAuthenticated && !loading) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Entrar na conta"
      subtitle="Acesse seu painel com gráficos e cotações em tempo real"
      footer={
        <>
          Ainda não tem conta? <Link to="/cadastro" state={location.state}>Criar conta grátis</Link>
        </>
      }
    >
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <span className="login-spinner" /> : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
