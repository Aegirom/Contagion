import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout, { FEED } from './AuthLayout';
import InputField from './InputField';
import { AuthContext } from '../../../context/AuthContext';

const ACCENT = '#22C55E';

const EyeIcon = ({ open }) => open
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" strokeLinecap="round"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const result = await login(formData.email, formData.password, rememberMe);
      if (result.success) { setSuccess(true); setTimeout(() => navigate('/dashboard'), 1200); }
      else setError(result.error || 'Invalid credentials');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <AuthLayout leftContent={FEED}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `1px solid ${ACCENT}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: '#555' }}>Redirecting to dashboard…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftContent={FEED}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#D4D4D4', letterSpacing: '-0.025em', margin: '0 0 6px' }}>
          Sign in
        </h1>
        <p style={{ fontSize: 12, color: '#4A4A4A', margin: 0 }}>
          No account?{' '}
          <Link to="/register" style={{ color: ACCENT, textDecoration: 'none' }}>Request access</Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '9px 13px',
          background: '#EF444408',
          border: '1px solid #EF444420',
          borderRadius: 6,
          fontSize: 11,
          color: '#EF4444',
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@company.com"
          required
          accentColor={ACCENT}
        />

        <div>
          <InputField
            label="Password"
            name="password"
            type={showPass ? 'text' : 'password'}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            accentColor={ACCENT}
            suffixButton={
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showPass ? ACCENT : '#404040', display: 'flex' }}>
                <EyeIcon open={showPass} />
              </button>
            }
          />
          {/* Forgot password — placed directly under password field for discoverability */}
          <div style={{ textAlign: 'right', marginTop: 7 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 11, color: '#6B6B6B', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = ACCENT}
              onMouseLeave={e => e.target.style.color = '#6B6B6B'}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginTop: 2 }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ accentColor: ACCENT, width: 12, height: 12 }}
          />
          <span style={{ fontSize: 11, color: '#555' }}>Remember me</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px',
            background: loading ? '#111' : ACCENT,
            border: `1px solid ${loading ? '#1E1E1E' : ACCENT}`,
            borderRadius: 6,
            color: loading ? '#404040' : '#000',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#4ADE80'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = ACCENT; }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Footer link */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #111', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#3A3A3A' }}>
          New to Contagion?{' '}
          <Link
            to="/register"
            style={{ color: '#5A5A5A', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = ACCENT}
            onMouseLeave={e => e.target.style.color = '#5A5A5A'}
          >
            Request analyst access →
          </Link>
        </span>
      </div>
    </AuthLayout>
  );
};

export default LoginForm;
