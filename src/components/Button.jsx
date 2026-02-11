import React, { useState } from 'react';
import '../styles/Button.css';

const positionTransforms = {
  center: 'translate(-50%, -50%)',
  left: 'translateY(-50%)',
  right: 'translateY(-50%)',
  'top-center': 'translateX(-50%)',
  'bottom-center': 'translateX(-50%)',
};

const Button = ({
  children,
  onClick,
  className = '', // 👈 default to empty string
  variant = 'primary',
  size = 'md',
  borderRadius = '8px',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  margin = '0px',
  type = 'button',
  width,
  positionType = 'static',
  position = '',
  style = {},
  hoverScale = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const classList = [
    'btn',
    variant ? `btn-${variant}` : '',
    size ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    disabled && !loading ? 'btn-disabled' : '',
    position ? `btn-pos-${position}` : '',
    className, // 👈 finally append user-provided classes (e.g. Tailwind)
  ]
    .filter(Boolean)
    .join(' ');

  const positionTransform = positionTransforms[position] || '';
  const scaleTransform = onClick && isPressed ? 'scale(0.9)' : 'scale(1)';
  const combinedTransform = [positionTransform, scaleTransform]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      onMouseDown={onClick ? () => setIsPressed(true) : undefined}
      onMouseUp={onClick ? () => setIsPressed(false) : undefined}
      type={type}
      className={classList}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled || loading}
      style={{
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        transform: combinedTransform,
        borderRadius,
        margin,
        ...(width ? { width } : {}),
        position: positionType,
        ...style,
      }}
    >
      {loading ? (
        <>
          <span className="spinner" /> Loading...
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
