import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal'; 
import Button from '../Button';
import Text from '../Text';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Spacer from '../Spacer';
import { Users, Target, UserCheck } from 'lucide-react';

const InviteTypeModal = ({ isOpen, onClose, onSelectType }) => {
  const [selectedType, setSelectedType] = useState(null);

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType(selectedType);
      setSelectedType(null);
      // Don't close here - let the parent handle closing after opening the next modal
    }
  };

  const inviteTypes = [
    {
      type: 'targeted',
      title: 'Targeted Invitation',
      description: 'Pre-select parents for the invitee. The form will have pre-filled father and mother fields.',
      icon: Target,
    },
    {
      type: 'nontargeted',
      title: 'Non-Targeted Invitation',
      description: 'Invitee selects parents from dropdowns of direct-line relatives. Requires proof submission for approval.',
      icon: UserCheck,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <Column margin='25px 0px 0px 0px' padding='0px' gap='1rem'>
        <Text as="h2" variant="h3" bold>Select Invitation Type</Text>
        <Text variant="caption" color="gray-dark">Choose the type of invitation to create. This determines the workflow for the invitee.</Text>

        {/* Mode Selection Cards */}
        <Row padding='0.5rem' margin='0px'>
          {inviteTypes.map(({ type, title, description, icon: Icon }) => (
            <Card
              key={type}
              height='150px'
              style={{
                border: selectedType === type ? '2px solid var(--color-primary)' : '2px solid var(--color-gray-light)',
                background: selectedType === type ? 'var(--color-primary-light)' : 'var(--color-white)',
                cursor: 'pointer'
              }}
              onClick={() => handleSelect(type)}
            >
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <Icon size={24} style={{ marginBottom: '8px' }} />
                <Text bold variant="body1">{title}</Text>
                <Spacer size='sm' />
                <Text variant="caption1" align='start' paragraph color="gray-dark">{description}</Text>
              </div>
            </Card>
          ))}
        </Row>

        <Row margin='0px' padding='10px 0px 0px 0px'>
          <Button fullWidth variant="secondary" onClick={onClose}>Cancel</Button>
          <Button fullWidth variant="primary" onClick={handleConfirm} disabled={!selectedType}>Next</Button>
        </Row>
      </Column>
    </Modal>
  );
};

export default InviteTypeModal;
