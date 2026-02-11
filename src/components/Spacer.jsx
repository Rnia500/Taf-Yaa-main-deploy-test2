import React from 'react';

const sizeMap = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '32px',
  xl: '64px',
};

function Spacer({ size = 'md', vertical = true }) {
  const actualSize = sizeMap[size] || size;
  return (
    <div
      style={
        vertical
          ? { height: actualSize, width: '100%' }
          : { width: actualSize, height: '100%' }
      }
    />
  );
}

export default Spacer;