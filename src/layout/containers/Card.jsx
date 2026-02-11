import React, { useState } from 'react';
import '../../styles/Card.css';

function Card({
  children,
  padding = '10px',
  margin = 'auto',
  shadow = false,
  rounded = false,
  maxWidth,
  className = '',
  borderRadius = '8px',
  width = '100%',
  height = 'auto',
  backgroundColor = "var(--color-defaultCardbg)",
  alignItems = 'center',
  justifyContent = 'center',
  borderColor = backgroundColor,
  positionType = 'static',
  position = '',
  top,
  right,
  bottom,
  left,
  onClick,
  fitContent = false,
  scrolling,
  size,
  style = {}, 
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const positionClass = position ? `pos-${position}` : '';

  
  const finalWidth = size ? size : width;
  const finalHeight = size ? size : height;

  const circleStyles = rounded
    ? {
        width: finalWidth === '100%' ? '50px' : finalWidth,
        height: finalHeight === 'auto' ? '50px' : finalHeight,
        borderRadius: '50%',
        padding: 0,
      }
    : {};

  const scale =
    onClick && isPressed ? 'scale(0.9)' :
    onClick && isHovered ? 'scale(1.05)' :
    'scale(1)';
  
    const scrollClass = scrolling === 'horizontal'
    ? 'card-scroll-horizontal'
    : scrolling === 'vertical'
      ? 'card-scroll-vertical'
      : '';

  const combinedStyle = {
    position: positionType,
    top,
    right,
    bottom,
    left,
    display: 'flex',
    flexDirection: 'column',
    alignItems,
    justifyContent,
    padding,
    maxWidth,
    margin,
    borderRadius,
    width: fitContent ? 'fit-content' : finalWidth,
    height: fitContent ? 'fit-content' : finalHeight,
    backgroundColor,
    borderColor,
    ...circleStyles,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    transform: scale,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      className={`card-container ${shadow ? 'shadow' : ''} ${positionClass} ${className} ${onClick ? 'card-clickable' : ''} ${scrollClass}`}
      style={combinedStyle}
      onClick={onClick}
      onMouseEnter={onClick ? () => setIsHovered(true) : undefined}
      onMouseLeave={onClick ? () => { setIsHovered(false); setIsPressed(false); } : undefined}
      onMouseDown={onClick ? () => setIsPressed(true) : undefined}
      onMouseUp={onClick ? () => setIsPressed(false) : undefined}
    >
      {children}
    </div>
  );
}

export default Card;
