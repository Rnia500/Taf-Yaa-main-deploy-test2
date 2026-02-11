// components/layout/Row.jsx
import React from 'react';
import '../../styles/Row.css';

const Row = ({
  children,
  gap = '1rem',
  padding = '1rem',
  margin = "0px",
  width = '100%',
  maxWidth,
  justifyContent = 'center',
  alignItems = 'center',
  style,
  fitContent = false,
  fitContentJustifyContent = 'center',
  fitContentAlignItems = 'center',
}) => {
  return (
    <div
      className="layout-row"
      style={{
        gap,
        width,
        maxWidth,
        margin,
        padding,
        alignItems,
        justifyContent,
        ...style,
      }}
    >
      {React.Children.map(children, child => {
        const hasFixedWidth =
          child?.props?.style?.width ||
          child?.props?.width ||
          child?.props?.className?.includes?.('fixed');

        return (
          <div
            style={{
              flex: fitContent
                ? '0 1 auto' 
                : (hasFixedWidth ? '0 0 auto' : '1 1 0'),
              minWidth: 0, 
              display: 'flex',
              justifyContent: fitContent ? fitContentJustifyContent : justifyContent, 
              alignItems: fitContent ? fitContentAlignItems : 'center',     
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default Row;
