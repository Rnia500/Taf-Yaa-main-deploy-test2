import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import FlexContainer from '../../layout/containers/FlexContainer';
import Divider from '../Divider';
import Row from '../../layout/containers/Row';
import ToggleSwitch from '../ToggleSwitch';
import Card from '../../layout/containers/Card';

const WarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Warning',
  message = 'This action may have consequences. Are you sure you want to proceed?',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  confirmVariant = 'warning',
  cancelVariant = 'secondary',
  ...modalProps
}) => {
  const [dontRemindMe, setDontRemindMe] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontRemindMe);
    onClose();
  };


  return (
    <Modal style={{overvlowX: 'hidden', padding: '0px'}} title={title} isOpen={isOpen} onClose={onClose} showCLoseIcon = {false} {...modalProps}>
     
     <FlexContainer style={{overvlowX: 'hidden'}} padding='5px 16px 16px 16px'  direction="column" gap="5px"> 
        <Divider />
        <Text variant="p">{message}</Text>

        <Row alignItems='center' justifyContent='start' padding='0px' margin='0px' fitContent style={{overflowY:'hidden'}}>
            <ToggleSwitch
            checked={dontRemindMe}
            onChange={setDontRemindMe}
            />
            <Text variant="caption">Don't remind me again</Text>
        </Row>
        <Row padding='0px' justifyContent="flex-end" gap="10px" margin='20px 0px 0px 0px'>
          <Button fullWidth variant={cancelVariant} onClick={onClose}>
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

export default WarningModal;
