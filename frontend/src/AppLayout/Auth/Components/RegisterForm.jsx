import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout, { REASONS } from './AuthLayout';
import InputField from './InputField';
import { AuthContext } from '../../../context/AuthContext';

const ACCENT = '#8B5CF6';

const calcStr = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STR_COLORS = ['', '#EF4444', '#F59E0B', '#22C55E', '#22C55E'];
const STR_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

const EyeIcon = ({ open }) => open
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" strokeLinecap="round"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const RegisterForm = () => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = calcStr(formData.password);
  const pwMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleChange = e => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) { setError('Please fill in all fields'); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords don't match"); return; }
    if (strength < 2) { setError('Password is too weak'); return; }
    setLoading(true); setError('');
    try {
      const result = await register(formData);
      if (result.success) setSuccess(true);
      else setError(result.error || 'Registration failed');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <AuthLayout leftContent={REASONS}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#D4D4D4', letterSpacing: '-0.025em', margin: '0 0 8px' }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 12, color: '#4A4A4A', margin: '0 0 20px', lineHeight: 1.6 }}>
            Verification link sent to{' '}
            <span style={{ color: ACCENT }}>{formData.email}</span>
          </p>
          <p style={{ fontSize: 11, color: '#525252', lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>
          <Link
            to="/login"
            style={{ fontSize: 12, color: '#5A5A5A', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = ACCENT}
            onMouseLeave={e => e.target.style.color = '#5A5A5A'}
          >
            ← Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftContent={REASONS}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#D4D4D4', letterSpacing: '-0.025em', margin: '0 0 6px' }}>
          Create account
        </h1>
        <p style={{ fontSize: 12, color: '#4A4A4A', margin: 0 }}>
          Already have access?{' '}
          <Link to="/login" style={{ color: ACCENT, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      {error && (
        <div style={{
          padding: '9px 13px',
          background: '#EF444408',
          border: '1px solid #EF444418',
          borderRadius: 6,
          fontSize: 11,
          color: '#EF4444',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InputField label="Full name" name="name" value={formData.name} onChange={handleChange} placeholder="Jane Smith" required accentColor={ACCENT} />
        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required accentColor={ACCENT} />

        <div>
          <InputField
            label="Password"
            name="password"
            type={showPass ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
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
          {formData.password && (
            <div style={{ marginTop: 7 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{
                    flex: 1, height: 2, borderRadius: 2,
                    background: n <= strength ? STR_COLORS[strength] : '#181818',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: STR_COLORS[strength] }}>{STR_LABELS[strength]}</span>
            </div>
          )}
        </div>

        <InputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          required
          accentColor={ACCENT}
          error={pwMismatch ? "Passwords don't match" : undefined}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px',
            background: loading ? '#111' : ACCENT,
            border: `1px solid ${loading ? '#1E1E1E' : ACCENT}`,
            borderRadius: 6,
            color: loading ? '#404040' : '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#A78BFA'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = ACCENT; }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterForm;
