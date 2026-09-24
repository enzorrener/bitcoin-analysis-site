import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BANNER_PRESETS, bannerStyle, displayNameOf, resizeImage, DEFAULT_BANNER } from '../../utils/profile';
import { formatDate } from '../../utils/formatters';
import PasswordInput from '../Login/PasswordInput';
import UserAvatar from './UserAvatar';
import { CheckIcon, CloseIcon, LockIcon, UserIcon } from '../Icons/Icons';
import '../Login/Login.css';
import '../Register/Register.css';
import './Profile.css';

const CameraIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const PASSWORD_RULES = [
  { label: 'Mínimo de 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Letras e números', test: (p) => /[A-Za-z]/.test(p) && /\d/.test(p) },
  { label: 'Letra maiúscula ou símbolo', test: (p) => /[A-Z]/.test(p) || /[^A-Za-z0-9]/.test(p) }
];

const STRENGTH_LABELS = ['Muito fraca', 'Fraca', 'Média', 'Forte'];

/**
 * Mensagem de retorno (sucesso ou erro) que some sozinha
 */
const useFeedback = () => {
  const [feedback, setFeedback] = useState(null);
  const timer = useRef(null);

  const show = (type, message) => {
    clearTimeout(timer.current);
    setFeedback({ type, message });
    if (type === 'success') timer.current = setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  return [feedback, show, () => setFeedback(null)];
};

const Feedback = ({ feedback, onClose }) =>
  feedback ? (
    <div className={`profile-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
      {feedback.type === 'success' && <CheckIcon size={16} />}
      <span>{feedback.message}</span>
      <button type="button" onClick={onClose} aria-label="Fechar">
        <CloseIcon size={14} />
      </button>
    </div>
  ) : null;

/**
 * Página "Meu perfil": foto, banner, dados pessoais e senha
 */
const Profile = () => {
  const { user, updateProfile, changePassword, isLocalAuth } = useAuth();

  // ===== Aparência (foto e banner) =====
  const [imageFeedback, showImageFeedback, clearImageFeedback] = useFeedback();
  const [savingImage, setSavingImage] = useState(null); // 'avatar' | 'banner' | null
  const [bannerMenu, setBannerMenu] = useState(false);
  const avatarInput = useRef(null);
  const bannerInput = useRef(null);

  // ===== Dados pessoais =====
  const initialInfo = useMemo(
    () => ({ name: user?.name || '', displayName: user?.displayName || '', email: user?.email || '' }),
    // Só os campos do formulário: trocar foto ou banner não apaga edições em andamento
    [user?.name, user?.displayName, user?.email]
  );
  const [info, setInfo] = useState(initialInfo);
  const [infoPassword, setInfoPassword] = useState('');
  const [infoErrors, setInfoErrors] = useState({});
  const [infoFeedback, showInfoFeedback, clearInfoFeedback] = useFeedback();
  const [savingInfo, setSavingInfo] = useState(false);

  // ===== Senha =====
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordFeedback, showPasswordFeedback, clearPasswordFeedback] = useFeedback();
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.title = 'Meu perfil | CryptoAnalysis';
    return () => {
      document.title = 'Análise Bitcoin | Relatório de Mercado';
    };
  }, []);

  useEffect(() => {
    setInfo(initialInfo);
  }, [initialInfo]);

  useEffect(() => {
    if (!bannerMenu) return undefined;
    const close = (event) => {
      if (!event.composedPath().some((el) => el instanceof Element && el.matches('.banner-menu, .banner-edit'))) {
        setBannerMenu(false);
      }
    };
    const onKey = (event) => event.key === 'Escape' && setBannerMenu(false);
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [bannerMenu]);

  const emailChanged = info.email.trim().toLowerCase() !== (user?.email || '');
  const infoDirty =
    info.name.trim() !== initialInfo.name ||
    info.displayName.trim() !== initialInfo.displayName ||
    emailChanged;
  const strength = PASSWORD_RULES.filter((rule) => rule.test(passwords.next)).length;

  // ===== Ações =====

  const saveImage = async (field, value, successMessage) => {
    setSavingImage(field);
    clearImageFeedback();
    try {
      await updateProfile({ [field]: value });
      showImageFeedback('success', successMessage);
    } catch (error) {
      showImageFeedback('error', error.message || 'Não foi possível salvar a imagem.');
    } finally {
      setSavingImage(null);
    }
  };

  const handleImageFile = async (event, field) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBannerMenu(false);
    try {
      const size = field === 'avatar' ? { width: 320, height: 320 } : { width: 1500, height: 420, quality: 0.82 };
      const dataUrl = await resizeImage(file, size);
      await saveImage(field, dataUrl, field === 'avatar' ? 'Foto de perfil atualizada.' : 'Banner atualizado.');
    } catch (error) {
      showImageFeedback('error', error.message);
    }
  };

  const handleInfoSubmit = async (event) => {
    event.preventDefault();
    clearInfoFeedback();

    const errors = {};
    if (info.name.trim().length < 2) errors.name = 'Informe seu nome (mínimo de 2 caracteres).';
    if (info.displayName.trim().length > 60) errors.displayName = 'Máximo de 60 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(info.email.trim())) errors.email = 'Informe um e-mail válido.';
    if (emailChanged && !infoPassword) errors.currentPassword = 'Confirme com sua senha atual para trocar o e-mail.';
    setInfoErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingInfo(true);
    try {
      await updateProfile({
        name: info.name,
        displayName: info.displayName,
        email: info.email,
        ...(emailChanged && { currentPassword: infoPassword })
      });
      setInfoPassword('');
      showInfoFeedback('success', 'Informações salvas.');
    } catch (error) {
      if (error.field) setInfoErrors({ [error.field]: error.message });
      else showInfoFeedback('error', error.message || 'Não foi possível salvar.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    clearPasswordFeedback();

    const errors = {};
    if (!passwords.current) errors.currentPassword = 'Informe sua senha atual.';
    if (!PASSWORD_RULES[0].test(passwords.next)) errors.newPassword = 'A nova senha deve ter pelo menos 8 caracteres.';
    else if (!PASSWORD_RULES[1].test(passwords.next)) errors.newPassword = 'A nova senha deve conter letras e números.';
    if (passwords.confirm !== passwords.next) errors.confirm = 'As senhas não conferem.';
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      showPasswordFeedback('success', 'Senha alterada com sucesso.');
    } catch (error) {
      if (error.field) setPasswordErrors({ [error.field]: error.message });
      else showPasswordFeedback('error', error.message || 'Não foi possível alterar a senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  const currentBanner = user?.banner || DEFAULT_BANNER;

  return (
    <div className="container profile-page">
      {/* ===== Cabeçalho com banner e foto ===== */}
      <section className="profile-hero">
        <div className={`profile-banner ${savingImage === 'banner' ? 'busy' : ''}`} style={bannerStyle(user?.banner)}>
          <button type="button" className="banner-edit" onClick={() => setBannerMenu((open) => !open)} aria-expanded={bannerMenu}>
            <CameraIcon /> Alterar banner
          </button>

          {bannerMenu && (
            <div className="banner-menu" role="menu">
              <button type="button" className="banner-upload" onClick={() => bannerInput.current?.click()}>
                <CameraIcon /> Enviar imagem
                <small>Recomendado 1500 x 420 px</small>
              </button>
              <span className="banner-menu-label">Ou escolha um estilo</span>
              <div className="banner-presets">
                {Object.entries(BANNER_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={`banner-preset ${currentBanner === `preset:${key}` ? 'active' : ''}`}
                    style={{ background: preset.css }}
                    onClick={() => {
                      setBannerMenu(false);
                      saveImage('banner', `preset:${key}`, 'Banner atualizado.');
                    }}
                    aria-label={`Banner ${preset.label}`}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>
          )}
          <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => handleImageFile(e, 'banner')} />
        </div>

        <div className="profile-identity">
          <div className={`profile-avatar ${savingImage === 'avatar' ? 'busy' : ''}`}>
            <UserAvatar user={user} size={120} className="profile-avatar-initials" />
            <button type="button" className="avatar-edit" onClick={() => avatarInput.current?.click()} aria-label="Alterar foto de perfil">
              <CameraIcon size={17} />
            </button>
            <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => handleImageFile(e, 'avatar')} />
          </div>

          <div className="profile-names">
            <h1>{displayNameOf(user)}</h1>
            <p>
              {user?.name}
              {user?.createdAt && <span> • membro desde {formatDate(user.createdAt)}</span>}
            </p>
          </div>

          {user?.avatar && (
            <button
              type="button"
              className="btn btn-ghost profile-remove-photo"
              onClick={() => saveImage('avatar', null, 'Foto removida.')}
              disabled={savingImage === 'avatar'}
            >
              Remover foto
            </button>
          )}
        </div>

        <Feedback feedback={imageFeedback} onClose={clearImageFeedback} />
      </section>

      <div className="profile-grid">
        {/* ===== Dados pessoais ===== */}
        <form className="profile-card" onSubmit={handleInfoSubmit} noValidate>
          <div className="profile-card-head">
            <UserIcon size={18} />
            <div>
              <h2>Informações pessoais</h2>
              <p>Como você aparece no site e o e-mail usado para entrar.</p>
            </div>
          </div>

          <div className="login-form">
            <div className="form-group">
              <label htmlFor="profile-name">Nome completo</label>
              <input
                id="profile-name"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                autoComplete="name"
                className={infoErrors.name ? 'invalid' : ''}
              />
              {infoErrors.name && <span className="field-error">{infoErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="profile-display">Como quer ser chamado</label>
              <input
                id="profile-display"
                value={info.displayName}
                onChange={(e) => setInfo({ ...info, displayName: e.target.value })}
                placeholder={user?.name?.split(' ')[0] || 'Ex: Enzo'}
                maxLength={60}
                className={infoErrors.displayName ? 'invalid' : ''}
              />
              <span className="field-hint">Usado nas saudações e no menu. Se ficar vazio, usamos seu primeiro nome.</span>
              {infoErrors.displayName && <span className="field-error">{infoErrors.displayName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">E-mail</label>
              <input
                id="profile-email"
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                autoComplete="email"
                className={infoErrors.email ? 'invalid' : ''}
              />
              {infoErrors.email && <span className="field-error">{infoErrors.email}</span>}
            </div>

            {emailChanged && (
              <div className="form-group">
                <label htmlFor="profile-email-password">Senha atual (para confirmar o novo e-mail)</label>
                <PasswordInput
                  id="profile-email-password"
                  value={infoPassword}
                  onChange={(e) => setInfoPassword(e.target.value)}
                  autoComplete="current-password"
                  invalid={Boolean(infoErrors.currentPassword)}
                />
                {infoErrors.currentPassword && <span className="field-error">{infoErrors.currentPassword}</span>}
              </div>
            )}

            <Feedback feedback={infoFeedback} onClose={clearInfoFeedback} />

            <div className="profile-actions">
              {infoDirty && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setInfo(initialInfo);
                    setInfoErrors({});
                    setInfoPassword('');
                  }}
                >
                  Descartar
                </button>
              )}
              <button type="submit" className="login-btn" disabled={!infoDirty || savingInfo}>
                {savingInfo ? <span className="login-spinner" /> : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </form>

        {/* ===== Senha ===== */}
        <form className="profile-card" onSubmit={handlePasswordSubmit} noValidate>
          <div className="profile-card-head">
            <LockIcon size={18} />
            <div>
              <h2>Segurança</h2>
              <p>Troque sua senha de acesso.</p>
            </div>
          </div>

          <div className="login-form">
            {/* Campo oculto ajuda gerenciadores de senha a associar a conta */}
            <input type="email" value={user?.email || ''} autoComplete="username" readOnly hidden />

            <div className="form-group">
              <label htmlFor="current-password">Senha atual</label>
              <PasswordInput
                id="current-password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                autoComplete="current-password"
                invalid={Boolean(passwordErrors.currentPassword)}
              />
              {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="new-password">Nova senha</label>
              <PasswordInput
                id="new-password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                autoComplete="new-password"
                invalid={Boolean(passwordErrors.newPassword)}
              />
              {passwords.next && (
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
                  <li key={rule.label} className={rule.test(passwords.next) ? 'ok' : ''}>{rule.label}</li>
                ))}
              </ul>
              {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar nova senha</label>
              <PasswordInput
                id="confirm-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                autoComplete="new-password"
                invalid={Boolean(passwordErrors.confirm)}
              />
              {passwordErrors.confirm && <span className="field-error">{passwordErrors.confirm}</span>}
            </div>

            <Feedback feedback={passwordFeedback} onClose={clearPasswordFeedback} />

            <div className="profile-actions">
              <button type="submit" className="login-btn" disabled={savingPassword || !passwords.current || !passwords.next}>
                {savingPassword ? <span className="login-spinner" /> : 'Alterar senha'}
              </button>
            </div>

            {isLocalAuth && (
              <p className="auth-local-note">
                <LockIcon size={14} /> Modo demonstração: seus dados e imagens ficam salvos apenas neste navegador.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
