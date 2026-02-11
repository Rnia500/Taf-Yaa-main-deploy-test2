import React, { useMemo } from "react";
import Card from "../layout/containers/Card";
import Row from "../layout/containers/Row";
import Column from "../layout/containers/Column";
import Text from "./Text";
import Button from "./Button";
import { Lightbulb, GitMerge, Clock as ClockIcon, Users } from "lucide-react";
import { formatArrivalTime } from "../utils/featuresUtils/formatArrivalTime"

const typeToIcon = {
  suggestions: <Lightbulb size={16} />,
  merge: <GitMerge size={16} />,
  requests: <ClockIcon size={16} />,
  activity: <Users size={16} />,
};


const NotificationOverviewCard = ({
  type = "activity",
  title,
  description,
  createdAt,
  onClick,
}) => {
  const icon = typeToIcon[type] || typeToIcon.activity;
  const timeLabel = useMemo(() => formatArrivalTime({ createdAt }), [createdAt]);

  return (
    <Card padding="1rem" backgroundColor="var(--color-white)" onClick={onClick} hover style={{ height: '100px', overflow: 'hidden' }}>
        <Card fitContent positionType="absolute" margin="-5px 0px 0px -5px" backgroundColor="var(--color-transparent)" position="top-right">
         <Text variant="caption2" color="secondary-text" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>{timeLabel}</Text>
        </Card>
      
      <Row gap="0.75rem" padding="0" justifyContent="flex-start" alignItems="flex-start" style={{ height: '100%', overflow: 'hidden', width: '100%' }}>
        <div style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card backgroundColor="var(--color-primary-light)" padding="0.5rem" borderRadius="8px" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { color: "var(--color-primary)" })}
          </Card>
        </div>
        <Column padding="0" gap="0.25rem" width="250px" flex="1"  style={{ minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
          <div className="w-52">
             <Text variant="body1" ellipsis bold color="primary-text">{title}</Text> 
          </div>
          <Text variant="body2" ellipsisLines={2} ellipsis color="secondary-text" lineHeight="1.4" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
            {description}
          </Text>
        </Column>
      </Row>
    </Card>
  );
};

export default NotificationOverviewCard; 