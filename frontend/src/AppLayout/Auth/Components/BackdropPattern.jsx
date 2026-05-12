import React from 'react';

const BackdropPattern = () => {
  return (
    <>
      {/* Subtle light grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
    </>
  );
};

export default BackdropPattern;
