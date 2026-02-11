import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Input.css';


export const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  backgroundColor = "var(--color-transparent)",
  color = "var(--color-primary-text)",
  required,
  height = '48px',
  isPasswordField = false,
  leadingIcon = null,
  trailingIcon = null,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : 'text';

  return (
    <div
      className="input-group"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {label && (
        <label
          style={{
            fontSize: '0.95rem',
            marginBottom: '4px',
            color: 'var(--color-primary-text)',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}

      {/* Input Wrapper */}
      <div
      className='input-wrapper'
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor,
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: '6px',
          height,
        }}
      >
        {/* Leading Icon */}
        {leadingIcon && (
          <div
            className="leading-icon"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              paddingLeft: '5px',
              paddingRight: '0px',
              flexShrink: 0,
            }}
          >
            {leadingIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="input"
          style={{
            flex: 1,
            outline: 'none',
            border: 'none',
            backgroundColor: 'transparent',
            color,
            fontSize: '1rem',
            boxShadow: 'none', 
            padding: '0 8px',
            height: '100%',
          }}
          {...props}
        />

        {/* Trailing Icon / Eye Toggle */}
        {(isPasswordField || trailingIcon) && (
          <button
            type="button"
            onClick={isPasswordField ? toggleShowPassword : undefined}
            className="trailing-icon"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              background: 'transparent',
              border: 'none',
              padding: 0,           
              width: 'fit-content', 
              height: 'fit-content',
              cursor: isPasswordField ? 'pointer' : 'default',
              color: '#888',
              flexShrink: 0,
            }}
            tabIndex={0} 
          >
            {isPasswordField
              ? showPassword
                ? <EyeOff color='var(--color-danger)' className="h-5 w-5" />
                : <Eye color='var(--color-primary1)' className="h-5 w-5" />
              : trailingIcon}
          </button>
        )}
      </div>
    </div>
  );
};


export const SearchInput = ({ value, onChange, placeholder, onSearch, backgroundColor = "var(--color-transparent)", color = "var(--color-primary-text)", size = "md" }) => (
    <div className={`input-group search-input-group ${size}`}>
    <div className="input-wrapper" style={{ backgroundColor }}>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className={`input search ${size}`}
        onKeyDown={e => {
          if (e.key === 'Enter' && onSearch) {
            onSearch(value);
          }
        }}
        style={{ color }}
      />

      {/* Inline search button inside wrapper so it aligns like trailing icons */}
      <button
        type="button"
        className={`search-button ${value ? 'clear' : ''} ${size}`}
        onClick={() => {
          if (value) {
            onChange('');
          } else if (onSearch) {
            onSearch(value);
          }
        }}
        aria-label={value ? 'Clear search' : 'Search'}
      >
        {value ? '\u2716' : '\u{1F50D}'}
      </button>
    </div>
  </div>
);

export const TextArea = ({ label, value, onChange, placeholder, backgroundColor = "var(--color-transparent)", color = "var(--color-primary-text)" }) => (
  <div className="input-group">
    {label && <label>{label}</label>}
    <div className="input-wrapper" style={{ backgroundColor }}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="textarea"
        style={{ color, width: '100%', border: 'none', outline: 'none', resize: 'vertical', padding: '12px 16px', background: 'transparent' }}
      />
    </div>
  </div>
);
