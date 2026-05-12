import React from 'react';

const SharedLayout = ({
  children,
  footerText = 'CONTAGION v2.4.1',
  containerStyle = {},
  canvasRef,
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#F9FAFB', ...containerStyle }}
    >
      {/* Background canvas for animated orbs */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-[420px] animate-fade-up">
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: '#FFFFFF',
            backdropFilter: 'blur(24px)',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.08)',
          }}
        >
          {/* Decorative gradient line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)',
            }}
          />

          {children}
        </div>
        <p className="text-center mt-4 font-code text-[10px] tracking-widest" style={{ color: '#9CA3AF' }}>
          {footerText}
        </p>
      </div>
    </div>
  );
};

export default SharedLayout;
