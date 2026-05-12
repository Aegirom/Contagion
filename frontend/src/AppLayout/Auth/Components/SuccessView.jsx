import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SuccessView = ({
  // Content
  title = 'Check Your Inbox',
  subtitle = 'Reset link sent to:',
  message,
  email,
  showEmail = true,
  
  // Button/Link options
  linkText = 'Back to Login',
  linkTo = '/login',
  showLink = true,
  
  // Styling
  iconColor = '#22C55E',
  
  // Auto-redirect (for login success)
  redirectTo = null,
  redirectDelay = 3000,
  
  // Additional info (expires in, etc.)
  additionalInfo = 'Link expires in 15 minutes.',
  showAdditionalInfo = true,
}) => {
  const navigate = useNavigate();

  // Auto-redirect for login success
  useEffect(() => {
    if (redirectTo) {
      const timer = setTimeout(() => {
        navigate(redirectTo);
      }, redirectDelay);
      return () => clearTimeout(timer);
    }
  }, [redirectTo, redirectDelay, navigate]);

  return (
    <div className="text-center py-4 animate-scale-in">
      {/* Success Icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg width="68" height="68" viewBox="0 0 68 68">
            {/* Outer circle background */}
            <circle 
              cx="34" 
              cy="34" 
              r="30" 
              fill="none" 
              stroke={iconColor}
              strokeWidth="2"
              opacity="0.15"
            />
            
            {/* Animated circle */}
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
                animation: 'fadeIn 0.8s ease 0.1s both' 
              }}
            />
            
            {/* Checkmark */}
            <path 
              d="M21 34l9 9 17-18" 
              fill="none" 
              stroke={iconColor} 
              strokeWidth="2.5"
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ 
                filter: `drop-shadow(0 0 4px ${iconColor})`,
                animation: 'fadeIn 0.4s ease 0.6s both' 
              }}
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2
        className="font-display text-xl font-bold tracking-wider mb-3"
        style={{ 
          color: '#111827', 
          textShadow: `0 0 20px ${iconColor}40`,
          animation: 'fadeUp 0.5s ease 0.35s both', 
          opacity: 0 
        }}
      >
        {title}
      </h2>

      {/* Content - Dynamic based on show flags */}
      <div style={{ animation: 'fadeUp 0.5s ease 0.5s both', opacity: 0 }}>
        {/* Subtitle */}
        {subtitle && (
          <p className="font-body text-sm mb-3" style={{ color: '#6B7280' }}>
            {subtitle}
          </p>
        )}

        {/* Email Display - Only if showEmail is true */}
        {showEmail && email && (
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-code text-sm mb-5" 
            style={{
              background: `${iconColor}0A`,
              border: `1px solid ${iconColor}33`,
              color: iconColor
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            {email}
          </div>
        )}

        {/* Custom Message - Only if provided */}
        {message && (
          <p className="font-body text-sm mb-5" style={{ color: '#6B7280' }}>
            {message}
          </p>
        )}

        {/* Additional Info - Only if showAdditionalInfo is true */}
        {showAdditionalInfo && additionalInfo && (
          <p className="font-code text-xs mb-6" style={{ color: '#9CA3AF' }}>
            {additionalInfo}
          </p>
        )}

        {/* Redirect Countdown - Only if redirectTo is set */}
        {redirectTo && (
          <p 
            className="font-code text-xs mb-6 animate-pulse" 
            style={{ color: iconColor }}
          >
            Redirecting to dashboard in {Math.ceil(redirectDelay / 1000)} seconds...
          </p>
        )}
      </div>

      {/* Action Button/Link - Only if showLink is true */}
      {showLink && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.65s both', opacity: 0 }}>
          <Link
            to={linkTo}
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
            {linkText}
          </Link>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessView;
