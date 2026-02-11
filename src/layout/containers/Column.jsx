// components/layout/Column.jsx
import React from 'react';
import '../../styles/Column.css';

const Column = ({
  children,
  gap = '1rem',
  padding = '1rem',
  margin = '0px',
  wrap = true,
  width = '100%',
  height = 'auto',
  fitContent = false, 
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  style,
}) => {
  return (
    <div
      className="layout-column"
      style={{
        gap,
        padding,
        margin,
        width,
        height,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        justifyContent,
        alignItems,
        ...style,
      }}
    >
      {React.Children.map(children, (child) => {
        const flexValue = fitContent ? '0 1 auto' : '1 1 0'; // ✅ allow shrink

        return (
          <div
            style={{
              flex: flexValue,
              width: fitContent ? 'auto' : '100%',
              minWidth: 0, // ✅ prevent content from overflowing
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

export default Column;
