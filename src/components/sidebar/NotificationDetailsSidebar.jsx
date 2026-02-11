import React from 'react';
import { X } from 'lucide-react';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Text from '../Text';
import Button from '../Button';
import { Tooltip } from '../Tooltip';
import JoinRequestDetails from './JoinRequestDetails';

const NotificationDetailsSidebar = ({
  notification,
  isOpen,
  onClose,
  onRefresh,
  className = ""
}) => {
  if (!isOpen || !notification) {
    return null;
  }

  // Render different content based on notification type
  const renderNotificationContent = () => {
    // Check if this is a join request by looking for requestData with join request properties
    if (notification.requestData && notification.requestData.JoinRequestId) {
      return (
        <JoinRequestDetails
          notification={notification}
          onRefresh={onRefresh}
          onClose={onClose}
        />
      );
    }

    switch (notification.type) {
      case 'system_notification':
        return (
          <Column gap="16px" padding="0" margin="0">
            <Card padding="16px" backgroundColor="var(--color-white)">
              <Column gap="12px" padding="0" margin="0">
                <Text variant="body1" bold>System Notification</Text>
                <Text variant="body2">{notification.message || 'No additional details available.'}</Text>
                {notification.metadata && (
                  <Column gap="8px" padding="0" margin="0">
                    {Object.entries(notification.metadata).map(([key, value]) => (
                      <Row key={key} gap="8px" padding="0" margin="0">
                        <Text variant="caption2" color="gray" style={{ minWidth: '100px' }}>
                          {key}:
                        </Text>
                        <Text variant="body2">{String(value)}</Text>
                      </Row>
                    ))}
                  </Column>
                )}
              </Column>
            </Card>
          </Column>
        );
      case 'user_notification':
        return (
          <Column gap="16px" padding="0" margin="0">
            <Card padding="16px" backgroundColor="var(--color-white)">
              <Column gap="12px" padding="0" margin="0">
                <Text variant="body1" bold>User Notification</Text>
                <Text variant="body2">{notification.message || 'No additional details available.'}</Text>
                {notification.metadata && (
                  <Column gap="8px" padding="0" margin="0">
                    {Object.entries(notification.metadata).map(([key, value]) => (
                      <Row key={key} gap="8px" padding="0" margin="0">
                        <Text variant="caption2" color="gray" style={{ minWidth: '100px' }}>
                          {key}:
                        </Text>
                        <Text variant="body2">{String(value)}</Text>
                      </Row>
                    ))}
                  </Column>
                )}
              </Column>
            </Card>
          </Column>
        );
      default:
        return (
          <Column gap="16px" padding="0" margin="0">
            <Card padding="16px" backgroundColor="var(--color-white)">
              <Column gap="12px" padding="0" margin="0">
                <Text variant="body1" bold>Notification Details</Text>
                <Text variant="body2">{notification.message || 'No additional details available.'}</Text>
                {notification.requestData && (
                  <Column gap="8px" padding="0" margin="0">
                    <Text variant="caption1" color="gray">Additional Data:</Text>
                    <Text variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {JSON.stringify(notification.requestData, null, 2)}
                    </Text>
                  </Column>
                )}
              </Column>
            </Card>
          </Column>
        );
    }
  };

  return (
    <div className={`notification-details-sidebar ${className}`}>
      <Column padding="20px 16px" margin='2rem 0rem 0rem 0rem' gap="16px">
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              {React.cloneElement(notification.icon, {
                color: "var(--color-primary)",
                size: 20
              })}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <Tooltip content={notification.title} style={{ marginTop: '2px' }}>
                <Text variant="body1" ellipsis bold color="primary-text" className="truncate" style={{ maxWidth: '190px' }}>
                  {notification.title}
                </Text>
              </Tooltip>
              <Text variant="caption2" color="secondary-text">
                {notification.timeLabel}
              </Text>
            </div>
          </div>
          <Card
            onClick={onClose}
            fitContent
            padding='3px'
            size={25}
            backgroundColor='var(--color-danger)'
          >
            <X size={18} color="white" strokeWidth={3} />
          </Card>
        </div>

        {/* Dynamic Content Based on Notification Type */}
        {renderNotificationContent()}
      </Column>
    </div>
  );
};

export default NotificationDetailsSidebar;
