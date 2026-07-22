import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logoMaxpesa from '../assets/maxpesa_logo_png.png';
import loginBanner from '../assets/guindaste6.png';
import './Login.css';

export default function Login() {
  const { signIn, resetPassword, notAllowedError, clearNotAllowedError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    clearNotAllowedError();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(error.message);
      }
    }

    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Digite seu e-mail no campo acima e clique em "Esqueci minha senha" novamente.');
      return;
    }
    setError('');
    setInfo('');
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setInfo('Enviamos um link de redefinição de senha para o seu e-mail.');
  }

  return (
    <div className="login-page">
      <div className="login-bg" style={{ '--login-bg-image': `url(${loginBanner})` }} />
      <div className="login-overlay" />

      <div className="login-card">
        <div className="login-logo-wrap">
          <img src={logoMaxpesa} alt="Grupo Maxpesa" className="login-logo" />
          <h3>Entrar</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu.nome@maxpesa.com.br"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {(error || notAllowedError) && <p className="login-message login-message-error">{error || notAllowedError}</p>}
          {info && <p className="login-message login-message-success">{info}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>

        <button type="button" onClick={handleForgotPassword} className="login-link login-link-muted">
          Esqueci minha senha
        </button>
      </div>
    </div>
  );
}
