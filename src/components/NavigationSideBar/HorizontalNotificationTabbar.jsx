import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/NavigationSideBar.css';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Text from '../../components/Text';

const HorizontalNotificationTabbar = ({
  navItems = [],
  onSectionChange,
  className = ""
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = React.useRef(null);
  const itemRefs = React.useRef({});

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const handleCustomAction = (action, itemId) => {
    if (action && typeof action === 'function') {
      action();
    } else if (itemId) {
      // Scroll to center the clicked item
      const itemElement = itemRefs.current[itemId];
      const container = scrollContainerRef.current;
      if (itemElement && container) {
        const containerWidth = container.offsetWidth;
        const itemWidth = itemElement.offsetWidth;
        const itemLeft = itemElement.offsetLeft;
        const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);

        
        setTimeout(() => {
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }, 0);
      }
    }
  };



  const renderNavItem = (item, index) => {
    const isActive = item.active || (item.path && location.pathname === item.path);

    if (item.component) {
      return (
        <div key={item.id || index} onClick={() => handleCustomAction(item.onClick)}>
          {item.component}
        </div>
      );
    }

    return (
      <Card
        key={item.id || index}
        ref={(el) => itemRefs.current[item.id || index] = el}
        padding="8px 12px"
        backgroundColor={isActive ? "var(--color-primary-light)" : "var(--color-white)"}
        onClick={() => {
          if (item.onClick) {
            handleCustomAction(item.onClick, item.id || index);
          } else if (item.path) {
            handleNavigation(item.path);
            // Scroll after navigation
            setTimeout(() => handleCustomAction(null, item.id || index), 100);
          }
          // Call onSectionChange if provided
          if (onSectionChange) {
            onSectionChange(item.id);
          }
        }}
        className="nav-item"
        style={{ flexShrink: 0, minWidth: '120px', width: 'auto' }}
      >
        <Row fitContent margin='0px' padding='0px' justifyContent="center" alignItems="center" gap="8px">
          {item.icon && (
            <div style={{
              color: isActive ? "var(--color-primary)" : "var(--color-gray)",
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.icon}
            </div>
          )}
          <Text
            variant="caption1"
            bold={isActive}
            color={isActive ? "primary" : "primary-text"}
          >
            {item.label}
          </Text>
          {item.count !== null && item.count !== undefined && (
            <Text variant="caption2" color="secondary-text">
              ({item.count})
            </Text>
          )}
        </Row>
      </Card>
    );
  };

  return (
    <div className={`horizontal-tabbar ${className}`}>
      <div ref={scrollContainerRef} style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '8px', whiteSpace: 'nowrap', alignItems: 'center' }}>
        {/* Navigation Items */}
        {navItems.map((item, index) => renderNavItem(item, index))}
      </div>
    </div>
  );
};

export default HorizontalNotificationTabbar;
