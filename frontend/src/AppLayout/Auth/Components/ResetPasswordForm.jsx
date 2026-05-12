import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout, { PW_REQUIREMENTS } from './AuthLayout';
import InputField from './InputField';
import { resetPassword } from '../../../services/authService';

const ACCENT = '#8B5CF6';

const strengthMeta = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ['', '#EF4444', '#F59E0B', '#22C55E', '#22C55E'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: s, color: colors[s], label: labels[s] };
};

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pw = strengthMeta(formData.password);
  const pwMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = searchParams.get('token');
    if (!token) { setError('Reset token is missing. Please use the link from your email.'); return; }
    if (!formData.password || !formData.confirmPassword) { setError('Please fill in all fields'); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords don't match"); return; }
    if (pw.score < 2) { setError('Password is too weak'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout leftContent={PW_REQUIREMENTS}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
            Password updated
          </h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 28px' }}>
            Your password has been reset successfully.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: ACCENT,
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#A78BFA'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            Go to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftContent={PW_REQUIREMENTS}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
          New password
        </h1>
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
          Choose a strong password for your account.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <InputField
            label="New password"
            name="password"
            type={showPass ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            accentColor={ACCENT}
            suffixButton={
                  <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showPass ? ACCENT : '#6B7280', display: 'flex' }}>
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" strokeLinecap="round"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            }
          />
          {formData.password && (
            <div style={{ marginTop: 7 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{
                    flex: 1, height: 2, borderRadius: 2,
                    background: n <= pw.score ? pw.color : '#E5E7EB',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: pw.color }}>{pw.label}</span>
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
            marginTop: 4,
            padding: '11px',
            background: loading ? '#E5E7EB' : ACCENT,
            border: `1px solid ${loading ? '#D1D5DB' : ACCENT}`,
            borderRadius: 6,
            color: loading ? '#404040' : '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#A78BFA'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = ACCENT; }}
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div style={{ marginTop: 28 }}>
        <Link
          to="/login"
          style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = ACCENT}
          onMouseLeave={e => e.target.style.color = '#9CA3AF'}
        >
          ← Back to login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordForm;
