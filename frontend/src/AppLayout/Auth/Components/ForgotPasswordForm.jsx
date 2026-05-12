import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout, { RESET_STEPS } from './AuthLayout';
import InputField from './InputField';
import { AuthContext } from '../../../context/AuthContext';

const ACCENT = '#22D3EE';

const ForgotPasswordForm = () => {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true); setError('');
    try {
      const result = await forgotPassword(email);
      if (result.success) setSubmitted(true);
      else setError(result.error || 'Failed to send reset link');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout leftContent={RESET_STEPS}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            Reset link sent to{' '}
            <span style={{ color: ACCENT }}>{email}</span>
          </p>
        </div>
        <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 }}>
          The link expires in 15 minutes. Check your spam folder if you don't see it.
        </p>
        <Link
          to="/login"
          style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = ACCENT}
          onMouseLeave={e => e.target.style.color = '#9CA3AF'}
        >
          ← Back to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftContent={RESET_STEPS}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
          Reset password
        </h1>
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
          Enter your email and we'll send a reset link.
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
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          accentColor={ACCENT}
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
            color: loading ? '#404040' : '#000',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#67E8F9'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = ACCENT; }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
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

export default ForgotPasswordForm;
