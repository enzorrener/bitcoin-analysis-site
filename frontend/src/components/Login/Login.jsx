import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.username || !form.password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    // Simula autenticação (substituir por chamada real à API)
    setTimeout(() => {
      setLoading(false);
      // Redirecionar para dashboard após login
      navigate('/');
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">₿</div>
          <span className="login-brand-text">CryptoAnalysis</span>
        </div>

        <h1 className="login-title">Entrar na conta</h1>
        <p className="login-subtitle">Acesse a plataforma de análise de Bitcoin</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Login</label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Digite seu login"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
