
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Input.css';

export const CompactTextField = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  height = '40px',
  isPasswordField = false,
  leadingIcon = null,
  trailingIcon = null,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="input-group" style={{ position: 'relative' }}>
      {label && <label style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{label}</label>}
      {leadingIcon && (
        <div className="leading-icon" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {leadingIcon}
        </div>
      )}
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input compact"
        style={{
          fontSize: '0.85rem',
          paddingLeft: leadingIcon ? '2.5rem' : '12px',
          paddingRight: isPasswordField || trailingIcon ? '2.5rem' : '12px',
          borderRadius: '6px',
          height: height,
        }}
        {...props}
      />
      {(isPasswordField || trailingIcon) && (
        <button
          type="button"
          onClick={isPasswordField ? toggleShowPassword : undefined}
          className="trailing-icon"
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: isPasswordField ? 'pointer' : 'default',
            color: 'gray',
          }}
          tabIndex={-1}
        >
          {isPasswordField ? (showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />) : trailingIcon}
        </button>
      )}
    </div>
  );
};
