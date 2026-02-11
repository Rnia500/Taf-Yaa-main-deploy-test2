// components/layout/Grid.jsx
import React from 'react';
import '../../styles/Grid.css';

const Grid = ({
  children,
  // ResponsiveGrid-style props (prioritized)
  responsive = true,
  minWidth = 280,
  maxWidth,
  minColumns,
  maxColumns,
  minRows,
  maxRows,
  gap = '0.5rem',
  gallery = false,
  // Legacy Grid props (for backward compatibility)
  columns = 3,
  width = '100%',
  height = 'auto',
  padding = '0px',
  fitContent = false,
  cellWidth,
  cellHeight,
  style = {},
  ...props
}) => {
  
  let gridTemplateColumns;

  if (gallery) {
    // Gallery mode: each item takes its natural size
    gridTemplateColumns = `repeat(auto-fit, minmax(min-content, max-content))`;
  } else if (fitContent) {
    // Legacy fitContent mode
    gridTemplateColumns = `repeat(auto-fit, minmax(min-content, max-content))`;
  } else if (responsive) {
    // ResponsiveGrid-style responsive mode
    const min = `${minWidth}px`;
    const max = maxWidth ? `${maxWidth}px` : '1fr';
    gridTemplateColumns = `repeat(auto-fit, minmax(${min}, ${max}))`;
  } else {
    // Rigid mode: check for new minColumns/maxColumns first, then fall back to legacy columns
    if (minColumns && maxColumns && minColumns === maxColumns) {
      // Fixed number of columns (ResponsiveGrid style)
      gridTemplateColumns = `repeat(${minColumns}, 1fr)`;
    } else if (minColumns && maxColumns) {
      // Min to max columns (ResponsiveGrid style)
      gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
    } else if (minColumns) {
      // Minimum columns (ResponsiveGrid style)
      gridTemplateColumns = `repeat(${minColumns}, 1fr)`;
    } else {
      // Legacy fixed columns
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
  }

  // Build grid template rows (ResponsiveGrid feature)
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
    width,
    height,
    padding,
    ...style,
  };

  // Legacy cell wrapping logic (optional, can be disabled)
  const shouldWrapCells = cellWidth || cellHeight || fitContent;

  if (shouldWrapCells) {
    return (
      <div
        className={`layout-grid ${responsive ? 'responsive-grid' : ''}`}
        style={gridStyle}
        {...props}
      >
        {React.Children.map(children, (child) => {
          const hasFixedWidth =
            child?.props?.style?.width ||
            child?.props?.width ||
            child?.props?.className?.includes('fixed');

          return (
            <div style={{
              width: cellWidth || (hasFixedWidth ? 'auto' : '100%'),
              height: cellHeight,
            }}>
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  // Modern approach: direct children without wrapping
  return (
    <div
      className={`layout-grid ${responsive ? 'responsive-grid' : ''} ${gallery ? 'gallery-grid' : ''}`}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default Grid;
