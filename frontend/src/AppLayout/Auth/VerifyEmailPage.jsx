import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from './Components/AuthLayout';
import { verifyEmail } from '../../services/authService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

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
        setMessage(error.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
      }
    };
    verifyToken();
  }, [searchParams]);

  const iconColor =
    status === 'success' ? '#22C55E' :
    status === 'error'   ? '#EF4444' :
                           '#8B5CF6';

  return (
    <AuthLayout>
      {/* Branding */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.25em', color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px' }}>
          Contagion
        </h1>
        <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0 }}>
          Email Verification
        </p>
      </div>

      {/* Status content */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="60" height="60" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="30" fill="none" stroke={iconColor} strokeWidth="1.5" opacity="0.12" />
            <circle
              cx="34" cy="34" r="30"
              fill="none" stroke={iconColor} strokeWidth="1.5"
              strokeLinecap="round"
              transform="rotate(-90 34 34)"
              style={{ filter: `drop-shadow(0 0 5px ${iconColor})`, opacity: 0.65,
                animation: status === 'verifying' ? 'spin 1s linear infinite' : 'none' }}
            />
            {status === 'success' && (
              <path d="M21 34l9 9 17-18" fill="none" stroke={iconColor} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${iconColor})` }} />
            )}
            {status === 'error' && (
              <path d="M22 22l24 24M46 22l-24 24" fill="none" stroke={iconColor} strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${iconColor})` }} />
            )}
          </svg>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 18, fontWeight: 500, color: '#111827', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          {status === 'verifying' ? 'Verifying…' :
           status === 'success'   ? 'Email Verified' :
                                    'Verification Failed'}
        </h2>

        {/* Message */}
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.65, margin: '0 0 28px' }}>
          {message}
        </p>

        {/* Action */}
        {status !== 'verifying' && (
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              borderRadius: 6,
              border: `1px solid ${iconColor}40`,
              color: iconColor,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${iconColor}10`;
              e.currentTarget.style.borderColor = `${iconColor}80`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = `${iconColor}40`;
            }}
          >
            {status === 'success' ? 'Go to login' : 'Back to login'}
          </Link>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
