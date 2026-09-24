import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../Login/AuthLayout';
import PasswordInput from '../Login/PasswordInput';
import '../Login/Login.css';
import './Register.css';

const PASSWORD_RULES = [
  { label: 'Mínimo de 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Letras e números', test: (p) => /[A-Za-z]/.test(p) && /\d/.test(p) },
  { label: 'Letra maiúscula ou símbolo', test: (p) => /[A-Z]/.test(p) || /[^A-Za-z0-9]/.test(p) }
];

const STRENGTH_LABELS = ['Muito fraca', 'Fraca', 'Média', 'Forte'];

const validate = (form) => {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Informe seu nome (mínimo de 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (!PASSWORD_RULES[0].test(form.password)) errors.password = 'A senha deve ter pelo menos 8 caracteres.';
  else if (!PASSWORD_RULES[1].test(form.password)) errors.password = 'A senha deve conter letras e números.';
  if (form.confirm !== form.password) errors.confirm = 'As senhas não conferem.';
  if (!form.terms) errors.terms = 'Confirme que leu o aviso para continuar.';
  return errors;
};

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const strength = useMemo(() => PASSWORD_RULES.filter((rule) => rule.test(form.password)).length, [form.password]);

  if (isAuthenticated && !loading) {
    return <Navigate to={location.state?.from || '/app'} replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...form, [name]: type === 'checkbox' ? checked : value };
    setForm(next);
    setSubmitError('');
    if (touched[name]) setErrors(validate(next));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate(location.state?.from || '/app', { replace: true, state: { welcome: true } });
    } catch (err) {
      if (err.field) setErrors((prev) => ({ ...prev, [err.field]: err.message }));
      else setSubmitError(err.message || 'Não foi possível criar a conta.');
      setLoading(false);
    }
  };

  const fieldError = (name) => touched[name] && errors[name];

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastre-se grátis para acessar seu painel personalizado"
      footer={
        <>
          Já tem conta? <Link to="/login" state={location.state}>Entrar</Link>
        </>
      }
    >
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Como devemos te chamar?"
            autoComplete="name"
            aria-invalid={Boolean(fieldError('name')) || undefined}
            className={fieldError('name') ? 'invalid' : ''}
            autoFocus
          />
          {fieldError('name') && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldError('email')) || undefined}
            className={fieldError('email') ? 'invalid' : ''}
          />
          {fieldError('email') && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Crie uma senha"
            autoComplete="new-password"
            invalid={Boolean(fieldError('password'))}
          />
          {form.password && (
            <div className="password-strength" aria-live="polite">
              <div className="strength-bars">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < strength ? `on s${strength}` : ''} />
                ))}
              </div>
              <span className="strength-label">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
          <ul className="password-rules">
            {PASSWORD_RULES.map((rule) => (
              <li key={rule.label} className={rule.test(form.password) ? 'ok' : ''}>
                {rule.label}
              </li>
            ))}
          </ul>
          {fieldError('password') && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirm">Confirmar senha</label>
          <PasswordInput
            id="confirm"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Repita a senha"
            autoComplete="new-password"
            invalid={Boolean(fieldError('confirm'))}
          />
          {fieldError('confirm') && <span className="field-error">{errors.confirm}</span>}
        </div>

        <label className="terms-check">
          <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} onBlur={handleBlur} />
          <span>
            Entendo que as análises têm caráter educacional e não são recomendação de investimento.
          </span>
        </label>
        {fieldError('terms') && <span className="field-error">{errors.terms}</span>}

        {submitError && <p className="login-error" role="alert">{submitError}</p>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <span className="login-spinner" /> : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
