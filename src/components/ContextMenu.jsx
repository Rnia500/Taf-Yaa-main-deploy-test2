import React, { useEffect, useRef } from 'react';
import '../styles/PersonMenu.css';

const ContextMenu = ({
  isOpen,
  position,
  onClose,
  items = [],
  title = "Actions"
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="person-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 10000,
      }}
    >
      <div className="person-menu-header">
        <div className="person-menu-title">{title}</div>
      </div>

      <div className="person-menu-items">
        {items.map((item, index) => (
          <button
            key={index}
            className="person-menu-item"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            style={item.style || {}}
          >
            {item.icon && (
              <item.icon size={15} />
            )}
            <span className="person-menu-text" style={item.textStyle || {}}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu;
