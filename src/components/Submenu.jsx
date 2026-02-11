import React from 'react';
import ReactDOM from 'react-dom';
import Text from './Text';
import Card from '../layout/containers/Card';
import { useClickOutside, useEscapeKey } from '../hooks/useClickOutside';
import '../styles/Submenu.css';

const Submenu = ({
  isOpen,
  onClose,
  position = { top: '60px', right: '40px' },
  children,
  className = '',
  title = '',
  showHeader = false,
  excludeRefs = []
}) => {
  const submenuRef = useClickOutside(onClose, isOpen, 50, excludeRefs); // 50ms delay for portal rendering
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={`submenu-container ${className}`}
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
        left: position.left,
        zIndex: 2000,
        animation: 'submenuSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      ref={submenuRef}
    >
      <Card
        padding="0.25rem"
        margin="0"
        shadow={true}
        backgroundColor="var(--color-white)"
        borderRadius="12px"
        width="auto"
        style={{minWidth:"100px", maxWidth:"200px", maxHeight:"250px"}}

      >
        {showHeader && title && (
          <div className="submenu-header">
            <Text variant="caption1" bold uppercase className="submenu-title">
              {title}
            </Text>
          </div>
        )}
        <div className="submenu-body">
          {children}
        </div>
      </Card>
    </div>,
    document.body
  );
};

export default Submenu;
