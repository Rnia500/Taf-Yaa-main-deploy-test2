// src/components/Modals/ConfirmationModal.jsx
import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import FlexContainer from '../../layout/containers/FlexContainer';
import Divider from '../Divider';
import Row from '../../layout/containers/Row';
import ToggleSwitch from '../ToggleSwitch';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,   
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  ...modalProps
}) => {
  console.log("[ConfirmationModal] Rendering, isOpen:", isOpen);
  const [rememberChoice, setRememberChoice] = useState(false);

  const handleConfirm = () => {
    if (onConfirm) onConfirm(rememberChoice); 
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel(); 
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose} {...modalProps} style={{ zIndex: 12000, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
      <FlexContainer padding='0.5rem' direction="column" gap="5px">

        <Text variant="p">{message}</Text>

        <Row alignItems='center' justifyContent='start' padding='0px' margin='0px' fitContent style={{overflowY:'hidden'}}>
          <ToggleSwitch
            checked={rememberChoice}
            onChange={setRememberChoice}
          />
          <Text variant="caption">Remember my choice for this action</Text>
        </Row>

        <Row padding='0px' justifyContent="flex-end" gap="10px" margin='20px 0px 0px 0px'>
          <Button fullWidth variant={cancelVariant} onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button fullWidth variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </Row>
      </FlexContainer>
    </Modal>
  );
};

export default ConfirmationModal;
