import React, { useState, useMemo } from 'react';
import SelectDropdown from './SelectDropdown';
import DateInput from './DateInput';
import { TextInput, TextArea } from './Input';
import Button from './Button';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Text from './Text';
import { EVENT_TYPE_LABELS } from '../models/treeModels/EventModel';
import { X } from 'lucide-react';

const EventCard = ({ events = [], onEventsChange, showEventList = true, editingEvent = null, isAddingDescription = false }) => {
  const initialFormState = {
    type: '',
    customType: '',
    title: '',
    description: '',
    date: '',
    location: ''
  };

  const [eventData, setEventData] = useState(editingEvent ? {
    type: editingEvent.type,
    customType: editingEvent.customType || '',
    title: editingEvent.title || '',
    description: editingEvent.description || '',
    date: editingEvent.date || '',
    location: editingEvent.location || ''
  } : initialFormState);

  // FIX 1: Use a stable ID for editing, not a fragile index.
  const [editingId, setEditingId] = useState(editingEvent ? editingEvent.id : null);

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  // Check if two event data objects are the same (ignoring metadata)
  const areEventsEqual = (eventA, eventB) => {
    return Object.keys(initialFormState).every(key => eventA[key] === eventB[key]);
  };

  const handleAddOrUpdateEvent = () => {
    if (!eventData.type) return;

    // Validation: Ensure birth event is always the earliest
    if (!isAddingDescription) {
      const birthEvent = events.find(e => e.type === 'birth');
      const isBirthEvent = eventData.type === 'birth';
      const proposedDate = eventData.date;

      if (proposedDate) {
        const proposedDateTime = new Date(proposedDate).getTime();

        if (isBirthEvent) {
          // If updating/adding birth, ensure no other event has earlier date
          const hasEarlierEvent = events.some(e => e.type !== 'birth' && e.date && new Date(e.date).getTime() < proposedDateTime);
          if (hasEarlierEvent) {
            alert('Birth event must have the earliest date. Please adjust other event dates or the birth date.');
            return;
          }
        } else if (birthEvent && birthEvent.date) {
          // If non-birth event, ensure its date is not earlier than birth
          const birthDateTime = new Date(birthEvent.date).getTime();
          if (proposedDateTime < birthDateTime) {
            alert('Event date cannot be earlier than the birth date.');
            return;
          }
        }
      }
    }

    //  EDIT LOGIC 
    if (editingId !== null) {
      const originalEvent = events.find(e => e.id === editingId);

      // FIX 4: Guard against submitting an unchanged event.
      if (originalEvent && areEventsEqual(originalEvent, eventData)) {
        console.warn("No changes detected. Update cancelled.");
        // Optionally, reset the form here as well.
        handleClearForm();
        return;
      }

      const updatedEvents = events.map(event =>
        event.id === editingId ? { ...originalEvent, ...eventData, updatedAt: new Date().toISOString() } : event
      );
      onEventsChange(updatedEvents);

      //  ADD LOGIC 
    } else {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        personIds: [],
        treeId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onEventsChange([...events, newEvent]);
    }

    handleClearForm(); // Reset form and exit edit mode after any successful submission.
  };

  const handleDeleteEvent = (eventIdToDelete) => {
    // If we delete the event we are currently editing, also clear the form.
    if (eventIdToDelete === editingId) {
      handleClearForm();
    }
    onEventsChange(events.filter(event => event.id !== eventIdToDelete));
  };

  // FIX 2: When a card is clicked, populate the form AND enter edit mode.
  const handleSelectEventForEdit = (event) => {
    setEditingId(event.id);
    setEventData({
      type: event.type,
      customType: event.customType || '',
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      location: event.location || ''
    });
  };

  // FIX 5: The clear button now also cancels the edit.
  const handleClearForm = () => {
    setEventData(initialFormState);
    setEditingId(null);
  };

  const eventTypeOptions = useMemo(() => [
    ...Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  ], []);

  const isEditing = editingId !== null;

  return (
    <Card padding='0px' backgroundColor='var(--color-transparent)' margin='20px 0px 0px 0px' width='100%'>
      {/*  Form Section  */}

      <div style={{display: 'flex', gap:'0.5rem', margin: '0.5rem 0rem', width: '100%'}}>
        <div style={{ width: '100%' }}>
          <label className="form-label">Event Type *</label>
          <SelectDropdown style={{ width: '100%' }} value={eventData.type} onChange={(e) => handleInputChange('type', e.target.value)} options={eventTypeOptions} placeholder={"Select event type"} />
        </div>

        <div className="form-group" style={{ width: '100%' }}>
          <label className="form-label">Title</label>
          <TextInput style={{ width: '100%' }} value={eventData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Event title" />
        </div>
      </div>

      {eventData.type === 'custom' && (
        <div  style={{ width: '100%', margin: '0.5rem 0rem', }}>
          <label className="form-label">Custom Event Type</label>
          <TextInput style={{ width: '100%' }} value={eventData.customType} onChange={(e) => handleInputChange('customType', e.target.value)} placeholder="Enter custom event type" />
        </div>
      )}

      <div style={{display: 'flex', gap:'0.5rem',  margin: '0.5rem 0rem', width: '100%'}}>
        <div  style={{ width: '100%' }}>
          <label className="form-label">Date</label>
          <DateInput style={{ width: '100%' }} value={eventData.date} onChange={(e) => handleInputChange('date', e.target.value)} placeholder="Select event date" disabled={isAddingDescription} />
        </div>
        <div  style={{ width: '100%' }}>
          <label className="form-label">Location</label>
          <TextInput style={{ width: '100%' }} value={eventData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Event location" />
        </div>
      </div>
      {/* </div> */}

      <div style={{ width: '100%', margin: '0.5rem 0rem',  }}>
        <label className="form-label">Description</label>
        <TextArea style={{ width: '100%' }} value={eventData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Event description" rows={3} />
      </div>

      <Row justifyContent="end" margin="15px 0px 0px 0px" gap="10px">
        {/* FIX 3: Dynamic button text and a clear cancel button. */}
        <Button onClick={handleAddOrUpdateEvent} fullWidth disabled={!eventData.type}>
          {isEditing ? 'Update Event' : 'Add Event'}
        </Button>
        <Button fullWidth onClick={handleClearForm} variant="secondary">
          {isEditing ? 'Cancel Edit' : 'Clear Form'}
        </Button>
      </Row>

      {/*  Display List Section  */}
      {events.length > 0 && showEventList && (
        <>
          <Text variant="heading3" margin="20px 0px 10px 0px">Added Events</Text>
          <Card alignItems='flex-start' scrolling="horizontal" padding="0px" margin='0px' backgroundColor="var(--color-transparent)" width='100%'>
            <Row margin='0px 0px 10px 0px' gap="0.5rem" padding="0" width="max-content" justifyContent="start" alignItems="start">
              {events.map((event) => (
                <Card
                  className={`added-events ${editingId === event.id ? 'editing' : ''}`} // Optional: add a class for styling the selected card
                  backgroundColor='var(--color-white)'
                  key={event.id}
                  width='240px'
                  height='100px'
                  margin="0.4rem"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectEventForEdit(event)}
                >
                  <Card onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} positionType='absolute' position='top-right' margin="5px 5px 0px 0px " fitContent padding="8px" backgroundColor="var(--color-danger)">
                    <X strokeWidth={3} color='white' size={15} />
                  </Card>
                  <Text variant="body" fontWeight="bold" className="event-type" style={{ marginBottom: '8px' }}>{EVENT_TYPE_LABELS[event.type] || event.customType || event.type}</Text>
                  {event.title && <Text variant="body" className="event-detail">Title: {event.title}</Text>}
                  {event.date && <Text variant="body" className="event-detail">Date: {new Date(event.date).toLocaleDateString()}</Text>}
                  {event.location && <Text variant="body" className="event-detail">Location: {event.location}</Text>}
                  {event.description && <Text variant="body" className="event-detail" isClamp lines={2}>Description: {event.description}</Text>}
                </Card>
              ))}
            </Row>
          </Card>
        </>
      )}
    </Card>
  );
};

export default EventCard;