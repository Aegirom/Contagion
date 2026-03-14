import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from './Components/AuthLayout';
import { verifyEmail } from '../../services/authService';

// Purple-tinted orbs for verify email page
const orbs = [
  { x: 0.85, y: 0.15, r: 0.45, color: [139, 92, 246], angle: 0, speed: 0.0003, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
  { x: 0.1, y: 0.8, r: 0.5, color: [34, 197, 94], angle: 2.5, speed: 0.00035, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
  { x: 0.6, y: 0.05, r: 0.38, color: [139, 92, 246], angle: 1.2, speed: 0.00045, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
  { x: 0.2, y: 0.4, r: 0.3, color: [34, 211, 238], angle: 3.8, speed: 0.00025, sineX: 0.14, cosY: 0.73, cosX: 0.11 },
];

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your email for the verification link.');
        return;
      }

      try {
        const result = await verifyEmail(token);
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        const errorMsg = error.response?.data?.error || 'Verification failed. The link may be expired or invalid.';
        setMessage(errorMsg);
      }
    };

    verifyToken();
  }, [searchParams]);

  const iconColor = status === 'success' ? '#22C55E' : status === 'error' ? '#EF4444' : '#8B5CF6';

  return (
    <AuthLayout orbs={orbs} canvasRef={canvasRef}>
      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <h1
          className="font-display text-2xl tracking-[0.3em] font-bold mb-1"
          style={{ color: '#F1F5F9', textShadow: '0 0 30px rgba(139,92,246,0.2)' }}
        >
          CONTAGION
        </h1>
        <p className="font-code text-[10px] tracking-widest uppercase" style={{ color: '#334155' }}>
          Email Verification
        </p>
      </div>

      {/* Status Content */}
      <div className="text-center py-4">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          {status === 'verifying' ? (
            <div className="relative">
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  opacity="0.15"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{
                    filter: `drop-shadow(0 0 6px ${iconColor})`,
                    opacity: 0.7,
                    animation: 'spin 1s linear infinite'
                  }}
                />
              </svg>
            </div>
          ) : status === 'success' ? (
            <div className="relative">
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  opacity="0.15"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{
                    filter: `drop-shadow(0 0 6px ${iconColor})`,
                    opacity: 0.7
                  }}
                />
                <path
                  d="M21 34l9 9 17-18"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: `drop-shadow(0 0 4px ${iconColor})`
                  }}
                />
              </svg>
            </div>
          ) : (
            <div className="relative">
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  opacity="0.15"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{
                    filter: `drop-shadow(0 0 6px ${iconColor})`,
                    opacity: 0.7
                  }}
                />
                <path
                  d="M18 18l32 32M50 18l-32 32"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: `drop-shadow(0 0 4px ${iconColor})`
                  }}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status Title */}
        <h2
          className="font-display text-xl font-bold tracking-wider mb-3"
          style={{
            color: '#F1F5F9',
            textShadow: `0 0 20px ${iconColor}40`
          }}
        >
          {status === 'verifying' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
        </h2>

        {/* Message */}
        <p className="font-body text-sm mb-6" style={{ color: '#94A3B8' }}>
          {message}
        </p>

        {/* Action Link */}
        {status !== 'verifying' && (
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 rounded-lg font-display text-sm tracking-widest uppercase font-bold transition-all duration-200"
            style={{
              background: 'transparent',
              border: `1px solid ${iconColor}4D`,
              color: iconColor
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${iconColor}14`;
              e.currentTarget.style.borderColor = `${iconColor}99`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = `${iconColor}4D`;
            }}
          >
            {status === 'success' ? 'Go to Login' : 'Back to Login'}
          </Link>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthLayout>
  );
};

export default VerifyEmailPage;