import { useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import InputField from './InputField';
import SuccessView from './SuccessView';
import { AuthContext } from '../../../context/AuthContext';

const ForgotPasswordForm = () => {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // Cyan-tinted orbs for forgot page
  const orbs = [
    { x: 0.2, y: 0.15, r: 0.42, color: [34, 211, 238], angle: 0, speed: 0.0004, sineX: 0.13, cosY: 0.69, cosX: 0.1 },
    { x: 0.8, y: 0.8, r: 0.48, color: [34, 197, 94], angle: 1.8, speed: 0.0003, sineX: 0.13, cosY: 0.69, cosX: 0.1 },
    { x: 0.75, y: 0.2, r: 0.32, color: [34, 211, 238], angle: 3.5, speed: 0.0005, sineX: 0.13, cosY: 0.69, cosX: 0.1 },
    { x: 0.15, y: 0.7, r: 0.28, color: [139, 92, 246], angle: 2.2, speed: 0.00025, sineX: 0.13, cosY: 0.69, cosX: 0.1 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: focused === field ? 'rgba(34,211,238,0.05)' : 'rgba(5,5,8,0.95)',
    border: `1px solid ${focused === field ? 'rgba(34,211,238,0.4)' : 'rgba(30,34,51,1)'}`,
    color: '#E2E8F0',
    boxShadow: focused === field ? '0 0 0 3px rgba(34,211,238,0.07)' : 'none',
  });

  if (submitted) {
    return (
      <AuthLayout
        orbs={orbs}
        canvasRef={canvasRef}
        containerStyle={{
          background: 'radial-gradient(circle at center, rgba(13,110,128,0.15) 0%, rgba(7,8,13,0.9) 100%)'
        }}
      >
        <SuccessView
          title="Check Your Inbox"
          subtitle="Reset link sent to:"
          email={email}
          showEmail={true}
          linkText="← Back to Login"
          linkTo="/login"
          iconColor="#22D3EE"
          additionalInfo="Link expires in 15 minutes."
          showAdditionalInfo={true}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      orbs={orbs}
      canvasRef={canvasRef}
    >
      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <h1
          className="font-display text-2xl tracking-[0.3em] font-bold mb-1"
          style={{ color: '#F1F5F9', textShadow: '0 0 30px rgba(34,211,238,0.2)' }}
        >
          CONTAGION
        </h1>
        <p className="font-code text-[10px] tracking-widest uppercase" style={{ color: '#334155' }}>
          Password Recovery
        </p>
      </div>

      <p className="font-body text-sm mb-8 text-center" style={{ color: '#475569' }}>
        Enter your email to receive a reset link.
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg font-code text-xs animate-fade-up" style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#F87171'
        }}>⚠ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
          placeholder="you@contagion.sec"
          required
          customStyle={inputStyle('email')}
          focusedColor="rgba(34,211,238,0.4)"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-colors duration-200 flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(34, 211, 238, 0.12)' : '#0891B2',
            color: loading ? 'rgba(34, 211, 238, 0.4)' : '#FFFFFF',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#22D3EE';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#0891B2';
            }
          }}
        >
          {loading ? (
            <>
              <span
                className="w-3.5 h-3.5 border-2 rounded-full inline-block"
                style={{
                  borderColor: 'rgba(34, 211, 238, 0.33)',
                  borderTopColor: 'transparent',
                  animation: 'spinSlow 0.7s linear infinite',
                }}
              />
              Sending...
            </>
          ) : (
            '→ Send Reset Link'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(30,34,51,0.7)' }}>
        <Link
          to="/login"
          className="font-code text-xs transition-colors duration-150"
          style={{ color: '#22D3EE' }}
          onMouseEnter={e => e.currentTarget.style.color='#67E8F9'}
          onMouseLeave={e => e.currentTarget.style.color='#22D3EE'}
        >
          ← Back to login
        </Link>
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

export default ForgotPasswordForm;
