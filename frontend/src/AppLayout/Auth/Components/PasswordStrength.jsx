import React from 'react';

const PasswordStrength = ({ password, strength }) => {
  if (!password) return null;

  const strengthColor = ['', '#EF4444', '#F59E0B', '#22D3EE', '#22C55E'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex-1 h-[2px] rounded-full transition-all duration-300"
            style={{
              background: n <= strength ? strengthColor : '#E5E7EB',
            }}
          />
        ))}
      </div>
      <span className="font-code text-[9px]" style={{ color: strengthColor }}>
        {strengthLabel}
      </span>
    </div>
  );
};

export const usePasswordStrength = (password) => {
  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = calcStrength(password);
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22D3EE', '#22C55E'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return { strength, strengthColor, strengthLabel, calcStrength };
};

export default PasswordStrength;
