import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import InputField from './InputField';
import PasswordStrength, { usePasswordStrength } from './PasswordStrength';
import { resetPassword } from '../../../services/authService';
import AuthLayout from './AuthLayout';

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [focused, setFocused] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const canvasRef = useRef(null);

  const { strength, strengthColor, strengthLabel, calcStrength } = usePasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === 'password') calcStrength(value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = searchParams.get('token');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (strength < 2) {
      setError('Password is too weak. Use uppercase, numbers, and symbols');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Password reset failed. The link may be expired.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: focused === field ? 'rgba(139,92,246,0.05)' : 'rgba(5,5,8,0.95)',
    border: `1px solid ${focused === field ? 'rgba(139,92,246,0.4)' : 'rgba(30,34,51,1)'}`,
    color: '#E2E8F0',
    boxShadow: focused === field ? '0 0 0 3px rgba(139,92,246,0.07)' : 'none',
  });

  const pwMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  // Purple-tinted orbs for reset password page
  const orbs = [
    { x: 0.85, y: 0.15, r: 0.45, color: [139, 92, 246], angle: 0, speed: 0.0003, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
    { x: 0.1, y: 0.8, r: 0.5, color: [34, 197, 94], angle: 2.5, speed: 0.00035, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
    { x: 0.6, y: 0.05, r: 0.38, color: [139, 92, 246], angle: 1.2, speed: 0.00045, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
    { x: 0.2, y: 0.4, r: 0.3, color: [34, 211, 238], angle: 3.8, speed: 0.00025, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
  ];

  if (success) {
    return (
      <AuthLayout orbs={orbs} canvasRef={canvasRef}>
        <div className="text-center py-4 animate-scale-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle cx="34" cy="34" r="30" fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.15" />
                <circle cx="34" cy="34" r="30" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 34 34)" style={{ filter: 'drop-shadow(0 0 6px #22C55E)', opacity: 0.7 }} />
                <path d="M21 34l9 9 17-18" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px #22C55E)' }} />
              </svg>
            </div>
          </div>

          <h2 className="font-display text-xl font-bold tracking-wider mb-3" style={{ color: '#F1F5F9', textShadow: '0 0 20px #22C55E40' }}>
            Password Reset!
          </h2>

          <p className="font-body text-sm mb-6" style={{ color: '#94A3B8' }}>
            Your password has been reset successfully. You can now login with your new password.
          </p>

          <Link
            to="/login"
            className="inline-block px-6 py-2.5 rounded-lg font-display text-sm tracking-widest uppercase font-bold transition-all duration-200"
            style={{ background: 'transparent', border: '1px solid #22C55E4D', color: '#22C55E' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#22C55E14'; e.currentTarget.style.borderColor = '#22C55E99'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#22C55E4D'; }}
          >
            Go to Login
          </Link>
        </div>

        <style>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in { animation: scale-in 0.3s ease-out; }
        `}</style>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout orbs={orbs} canvasRef={canvasRef}>
      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl tracking-[0.3em] font-bold mb-1" style={{ color: '#F1F5F9', textShadow: '0 0 30px rgba(139,92,246,0.2)' }}>
          CONTAGION
        </h1>
        <p className="font-code text-[10px] tracking-widest uppercase" style={{ color: '#334155' }}>
          Reset Password
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg font-code text-xs animate-fade-up" style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#F87171'
        }}>⚠ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-code text-[10px] tracking-[0.2em] uppercase transition-colors duration-200" style={{ color: focused === 'password' ? '#8B5CF6' : '#475569' }}>New Password</label>
            <button type="button" onClick={() => setShowPass(!showPass)} className="font-code text-[9px] tracking-widest uppercase transition-colors duration-150" style={{ color: showPass ? '#8B5CF6' : '#334155' }}>
              [{showPass ? 'HIDE' : 'SHOW'}]
            </button>
          </div>
          <InputField
            name="password"
            type={showPass ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            placeholder="••••••••••••"
            required
            customStyle={inputStyle('password')}
            focusedColor="rgba(139,92,246,0.4)"
          />
          {formData.password && (
            <PasswordStrength password={formData.password} strength={strength} />
          )}
        </div>

        <div>
          <label className="block font-code text-[10px] tracking-[0.2em] uppercase mb-2 transition-colors duration-200" style={{ color: focused === 'confirmPassword' ? '#8B5CF6' : '#475569' }}>
            Confirm Password
          </label>
          <div className="relative">
            <InputField
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocused('confirmPassword')}
              onBlur={() => setFocused(null)}
              placeholder="••••••••••••"
              required
              customStyle={{
                ...inputStyle('confirmPassword'),
                border: pwMismatch ? '1px solid rgba(239,68,68,0.4)' : inputStyle('confirmPassword').border,
              }}
              focusedColor="rgba(139,92,246,0.4)"
            />
            {formData.confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {!pwMismatch
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                }
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-colors duration-200 flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(139, 92, 246, 0.15)' : '#8B5CF6',
            color: loading ? 'rgba(139, 92, 246, 0.4)' : '#FFFFFF',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#A78BFA'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#8B5CF6'; }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 rounded-full inline-block" style={{ borderColor: 'rgba(139, 92, 246, 0.33)', borderTopColor: 'transparent', animation: 'spinSlow 0.7s linear infinite' }} />
              Resetting password...
            </>
          ) : (
            '→ Reset Password'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(30,34,51,0.7)' }}>
        <p className="font-code text-xs" style={{ color: '#334155' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#8B5CF6' }} onMouseEnter={e => e.currentTarget.style.color='#A78BFA'} onMouseLeave={e => e.currentTarget.style.color='#8B5CF6'}>
            Sign in →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthLayout>
  );
};

export default ResetPasswordForm;