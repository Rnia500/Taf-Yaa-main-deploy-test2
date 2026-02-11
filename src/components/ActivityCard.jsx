import React from "react";
import Card from "../layout/containers/Card";
import Row from "../layout/containers/Row";
import Column from "../layout/containers/Column";
import Text from "./Text";
import { Tooltip } from "./Tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  getActivityIcon,
  getActivityVariant,
  ACTIVITY_TYPES,
} from "../models/treeModels/ActivityModel";
import "../styles/ActivityCard.css";

const ActivityCard = ({
  activity,
  variant = null, // auto-detected if not provided
  showTimestamp = true,
  className = "",
  index: _index,
  ...props
}) => {
  const activityVariant = variant || getActivityVariant(activity.activityType);
  const icon = getActivityIcon(activity.activityType);

  // Get variant-specific styling
  const getVariantStyles = () => {
    switch (activityVariant) {
      case "person":
        return {
          borderColor: "var(--color-primary-light)",
          iconBg: "var(--color-primary-light)",
          iconColor: "var(--color-primary)",
        };
      case "story":
        return {
          borderColor: "var(--color-info-light)",
          iconBg: "var(--color-info-light)",
          iconColor: "var(--color-info)",
        };
      case "attachment":
        return {
          borderColor: "var(--color-warning-light)",
          iconBg: "var(--color-warning-light)",
          iconColor: "var(--color-warning)",
        };
      case "role":
        return {
          borderColor: "var(--color-success-light)",
          iconBg: "var(--color-success-light)",
          iconColor: "var(--color-success)",
        };
      case "settings":
        return {
          borderColor: "var(--color-secondary-light)",
          iconBg: "var(--color-secondary-light)",
          iconColor: "var(--color-secondary)",
        };
      default:
        return {
          borderColor: "var(--color-gray-light)",
          iconBg: "var(--color-gray-light)",
          iconColor: "var(--color-gray)",
        };
    }
  };

  const styles = getVariantStyles();

  // Get activity description
  const getDescription = () => {
    const { activityType, details, userName } = activity;

    switch (activityType) {
      case ACTIVITY_TYPES.PERSON_ADDED:
        return `${userName} added a new person: ${details.personName}`;
      case ACTIVITY_TYPES.PERSON_EDITED:
        return `${userName} edited person: ${details.personName}`;
      case ACTIVITY_TYPES.PERSON_DELETED:
        return `${userName} deleted person: ${details.personName}`;
      case ACTIVITY_TYPES.STORY_ADDED:
        return `${userName} added a new story: "${details.storyTitle}"`;
      case ACTIVITY_TYPES.STORY_EDITED:
        return `${userName} edited story: "${details.storyTitle}"`;
      case ACTIVITY_TYPES.STORY_DELETED:
        return `${userName} deleted story: "${details.storyTitle}"`;
      case ACTIVITY_TYPES.ATTACHMENT_ADDED:
        return `${userName} added an attachment to story: "${details.storyTitle}"`;
      case ACTIVITY_TYPES.ROLE_CHANGED:
        return `${userName} changed ${details.targetUserName}'s role from ${details.oldRole} to ${details.newRole}`;
      case ACTIVITY_TYPES.TREE_SETTINGS_EDITED:
        return `${userName} updated tree settings`;
      default:
        return `${userName} performed an action: ${activityType}`;
    }
  };

  return (
    <Card
      padding="0.2rem"
      backgroundColor="var(--color-white)"
      alignItems="flex-start"
      justifyContent="flex-start"
      border={`1px solid ${styles.borderColor}`}
      borderRadius="8px"
      hover
      className={`activity-card activity-card--${activityVariant} ${className}`}
      style={{
        position: "relative",
        height: "100px",
        minHeight: "90px",
        maxHeight: "90px",
      }}
      {...props}
    >
      <Card
        padding="0px"
        margin="0px 0px 0px 0 rem"
        fitContent
        backgroundColor="var(--color-transparent)"
        positionType="absolute"
        position="top-left"
      >
        <Row
          justifyContent="flex-start"
          gap="0.5rem"
          padding="0.2rem"
          margin="0"
          alignItems="flex-start"
        >
          {/* Activity Icon */}
          <div
            className="activity-icon"
            style={{
              flexShrink: 0,
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: styles.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
          >
            {icon}
          </div>

          {/* Activity Content */}
          <Column
            flex="1 "
            margin="5px 0px 0px 0px"
            padding="0px 0px 0.5rem 0.5rem"
            gap="0.125rem"
            style={{ minWidth: 0 }}
          >
            <Tooltip content={getDescription()}>
              <Text
                variant="body2"
                bold
                ellipsis
                ellipsisLines={2}
                style={{
                  wordBreak: "break-word",
                  fontSize: "0.875rem",
                  lineHeight: "1.2",
                }}
              >
                {getDescription()}
              </Text>
            </Tooltip>
          </Column>
        </Row>
      </Card>

      <Card
        padding="0px"
        margin="0px 0.5rem"
        fitContent
        backgroundColor="var(--color-transparent)"
        positionType="absolute"
        position="bottom-right"
      >
        {showTimestamp && (
          <Text
            variant="caption2"
            color="secondary-text"
            style={{ fontSize: "0.75rem" }}
          >
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })
              .replace(/seconds?/g, "sec")
              .replace(/minutes?/g, "min")
              .replace(/hours?/g, "hr")
              .replace(/days?/g, "d")
              .replace(/weeks?/g, "w")
              .replace(/months?/g, "mo")
              .replace(/years?/g, "yr")}
          </Text>
        )}
      </Card>

      {/* Additional details for specific activity types */}
      <Card
        padding="0px"
        margin="0px 0px 0.2rem 0.5rem"
        fitContent
        backgroundColor="var(--color-transparent)"
        positionType="absolute"
        position="bottom-left"
      >
        {activity.details.changedFields && (
          <Row
            justifyContent="start"
            fitContent
            padding="0px"
            margin="0px"
            gap="0.25rem"
          >
            <Text variant="caption2" color="secondary-text">
              Changed:{" "}
            </Text>
            <div
              style={{
                maxWidth: "200px",
                overflowX: "auto",
                display: "flex",
                gap: "0.25rem",
                flexWrap: "nowrap",
              }}
            >
              {activity.details.changedFields.map((change, _index) => (
                <Tooltip
                  key={_index}
                  content={
                    change.field === 'unknown fields'
                      ? 'Unknown fields were changed'
                      : `changed from ${change.oldValue || 'null'} to ${change.newValue || 'null'}`
                  }
                >
                  <span
                    style={{
                      backgroundColor: "var(--color-gray-light)",
                      padding: "0.125rem 0.375rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      color: "var(--color-secondary-text)",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {change.field}
                    {_index < activity.details.changedFields.length - 1
                      ? ","
                      : ""}
                  </span>
                </Tooltip>
              ))}
            </div>
          </Row>
        )}
      </Card>
    </Card>
  );
};

export default ActivityCard;
