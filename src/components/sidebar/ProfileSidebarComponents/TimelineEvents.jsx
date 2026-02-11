import React, { useState } from 'react';
import Divider from '../../Divider';
import Button from '../../Button';
import Card from '../../../layout/containers/Card';
import '../../../styles/TimeLine.css';
import ClampText from '../../ClampText';
import Text from '../../Text';
import { formatEventText } from '../../../models/treeModels/EventModel';

function TimelineEvent({ title, date, isLast, description, event, onAddDescription, peopleNameMap, onEditEvent }) {
  const [isDescriptionVisible, setDescriptionVisible] = useState(false);

  const toggleDescriptionVisibility = () => {
    setDescriptionVisible(!isDescriptionVisible);
  };

  const formattedDescription = formatEventText(event, peopleNameMap);

  return (
    <div className="timeline-event">
      <div className={`timeline-marker${isLast ? ' last' : ''}`} />
      <div className="timeline-content">
        <Divider thickness="1px" />
        <div className="timeline-title">{title}</div>
        <div className="timeline-date">{date}</div>

        <Button size='sm' onClick={toggleDescriptionVisibility} variant='info'>
          {isDescriptionVisible ? 'Hide description' : 'View event description'}
        </Button>
        {isDescriptionVisible && (
          <>
            <Card>
              <Text paragraph variant='caption1'>{formattedDescription}</Text>
            </Card>
            <Button size='sm' variant='secondary' onClick={() => onEditEvent(event)}>
              Edit Event
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Represents the entire timeline block with a list of events.
 */
export default function TimelineEvents({ events = [], onAddEvent, onAddDescription, peopleNameMap, onEditEvent }) {
  return (
    <Card backgroundColor="transparent" alignItems="flex-start">
      <div className="timeline-block">
        <Text variant='heading3'>Timeline Events</Text>
        <div className="timeline-list">
          {events.length === 0 && (
            <Text variant='body1' color='tertiary-text'>No Event available.</Text>
          )}
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              title={event.title}
              date={event.date}
              description={event.description}
              event={event}
              isLast={index === events.length - 1}
              onAddDescription={onAddDescription}
              peopleNameMap={peopleNameMap}
              onEditEvent={onEditEvent}
            />
          ))}
        </div>
        <Button onClick={onAddEvent} variant="primary" fullWidth>
          + Add Event
        </Button>
      </div>
    </Card>
  );
}
