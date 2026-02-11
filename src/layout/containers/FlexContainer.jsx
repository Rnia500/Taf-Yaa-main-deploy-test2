import React from 'react';
import '../../styles/FlexContainer.css';


function FlexContainer({
  children,
  direction = 'column', // or 'column'
  wrap = true,
  width = '100%',
  height = 'auto',
  gap = '16px',
  padding = '16px',
  align = 'flex-start',
  justify = 'flex-start',
  className = '',
  margin = '',
  backgroundColor,
  style
}) {


  const combinedStyle = {
    gap,
    padding,
    margin,
    width,
    height,
    flexDirection: direction,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: align,
    justifyContent: justify,
    backgroundColor,
    ...style
  }

  return (
    <div
      className={`responsive-container ${direction} ${className}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
}

export default FlexContainer;
