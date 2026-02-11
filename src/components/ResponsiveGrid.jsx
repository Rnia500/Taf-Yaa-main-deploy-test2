import React from 'react';

const ResponsiveGrid = ({
  children,
  responsive = true,
  minWidth = 280,
  maxWidth,
  minColumns,
  maxColumns,
  minRows,
  maxRows,
  gap = '0.5rem',
  style = {},
  ...props
}) => {
  // Build grid template columns
  let gridTemplateColumns;

  if (responsive) {
    // Responsive mode: auto-fit with minmax
    const min = `${minWidth}px`;
    const max = maxWidth ? `${maxWidth}px` : '1fr';
    gridTemplateColumns = `repeat(auto-fit, minmax(${min}, ${max}))`;
  } else {
    // Rigid mode: fixed number of columns
    if (minColumns && maxColumns && minColumns === maxColumns) {
      // Fixed number of columns
      gridTemplateColumns = `repeat(${minColumns}, 1fr)`;
    } else if (minColumns && maxColumns) {
      // Min to max columns
      gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
    } else if (minColumns) {
      // Minimum columns
      gridTemplateColumns = `repeat(${minColumns}, 1fr)`;
    } else {
      // Default to responsive if no rigid settings
      gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
    }
  }

  // Build grid template rows (optional)
  let gridTemplateRows;
  if (minRows || maxRows) {
    if (minRows && maxRows && minRows === maxRows) {
      gridTemplateRows = `repeat(${minRows}, 1fr)`;
    } else if (minRows) {
      gridTemplateRows = `repeat(${minRows}, auto)`;
    }
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns,
    ...(gridTemplateRows && { gridTemplateRows }),
    gap,
    ...style,
  };

  return (
    <div style={gridStyle} {...props}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
