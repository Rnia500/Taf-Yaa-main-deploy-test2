import React from 'react'
import Modal from '../layout/containers/Modal'
import EventCard from './EventCard'

const AddEditEvent = ({ isOpen, onClose, events = [], onEventsChange, editingEvent = null, isAddingDescription = false }) => {

  const handleEventsChange = (newEventsArray) => {
    if (onEventsChange) {
      onEventsChange(newEventsArray);

    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseIcon={true} style={{ padding: '20px', maxWidth: '600px', width: '100%' }}>
      <EventCard events={events} onEventsChange={handleEventsChange} showEventList={false} editingEvent={editingEvent} isAddingDescription={isAddingDescription} />
    </Modal>
  );
};

export default AddEditEvent