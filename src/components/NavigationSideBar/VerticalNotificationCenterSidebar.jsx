import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/NavigationSideBar.css';
import Card from '../../layout/containers/Card';
import Column from '../../layout/containers/Column';
import Row from '../../layout/containers/Row';
import Text from '../../components/Text';
import { ChevronRight } from 'lucide-react';

const VerticalNotificationCenterSidebar = ({
  navItems = [],
  title = "Menu",
  className = ""
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const handleCustomAction = (action) => {
    if (action && typeof action === 'function') {
      action();
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
        padding="8px"
        width='15rem'
        backgroundColor={isActive ? "var(--color-primary-light)" : "var(--color-white)"}
        onClick={() => {
          if (item.onClick) {
            handleCustomAction(item.onClick);
          } else if (item.path) {
            handleNavigation(item.path);
          }
        }}
        className="nav-item"
      >
        <Row fitContent margin='0px' width='100%' padding='0px' justifyContent="space-between" alignItems="center">
          <Row gap="12px" margin='0px' padding='0px' fitContent  alignItems="center">
            {item.icon && (
              <div style={{
                color: isActive ? "var(--color-primary)" : "var(--color-gray)",
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </div>
            )}
            <Row padding="0px" fitContent margin="0px" gap="2px">
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
              {item.subtitle && (
                <Text variant="caption" color="secondary-text">
                  {item.subtitle}
                </Text>
              )}
            </Row>
          </Row>
          {(item.path || item.onClick) && (
            <ChevronRight
              size={16}
              color={isActive ? "var(--color-primary)" : "var(--color-gray)"}
            />
          )}
        </Row>
      </Card>
    );
  };

  return (
    <div className={`navigation-sidebar ${className}`}>
      <Column  fitContent padding="20px 16px" gap="8px">
        {title && (
          <Text variant="heading3" as="h3" style={{ marginBottom: '16px' }}>
            {t(title)}
          </Text>
        )}

        {/* Navigation Items */}
        {navItems.map((item, index) => renderNavItem(item, index))}
      </Column>
    </div>
  );
};

export default VerticalNotificationCenterSidebar;
