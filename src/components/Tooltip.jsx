import React from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({ children, content }) => {
  const [visible, setVisible] = React.useState(false);
  const tooltipRef = React.useRef(null);

  return (
    <span
      className="tooltip-container"
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      ref={tooltipRef}
    >
      {children}
      {visible &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: tooltipRef.current?.getBoundingClientRect().top - 10,
              left: tooltipRef.current?.getBoundingClientRect().left +
                tooltipRef.current?.offsetWidth / 2,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#fff',
              color: '#2c3e50',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              zIndex: 10000,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e1e8ed',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {content}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #fff',
              }}
            />
          </div>,
          document.body
        )}
    </span>
  );
};

export { Tooltip };
