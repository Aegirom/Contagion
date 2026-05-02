import { useState } from 'react';

const InputField = ({ label, name, type = 'text', value, onChange, placeholder, required, error, disabled, suffixButton, accentColor = '#22C55E' }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: error ? '#EF4444' : '#303030', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '10px 13px',
            paddingRight: suffixButton ? 38 : 13,
            background: '#0D0D0D',
            border: `1px solid ${error ? '#EF444430' : focused ? `${accentColor}30` : '#161616'}`,
            borderRadius: 6,
            color: '#C8C8C8',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {suffixButton && (
          <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }}>
            {suffixButton}
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: '#EF4444', margin: 0 }}>{error}</p>}
    </div>
  );
};

export default InputField;
