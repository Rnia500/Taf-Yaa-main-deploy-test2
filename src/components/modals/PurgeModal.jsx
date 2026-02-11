import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import FlexContainer from '../../layout/containers/FlexContainer';
import Divider from '../Divider';
import Row from '../../layout/containers/Row';
import Card from '../../layout/containers/Card';
import { TextInput } from '../Input';

const PurgeModal = ({
  isOpen,
  onClose,
  onConfirm,
  familyName,
  ...modalProps
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  const handleConfirm = () => {
    if (confirmationText === familyName) {
      onConfirm();
      onClose();
      setConfirmationText('');
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Modal showCLoseIcon={false} style={{overflowX: 'hidden', padding: '0px'}} isOpen={isOpen} onClose={handleClose} {...modalProps}>
      <Card alignItems='start' padding='0px 0px 0px 20px' margin='0px' borderRadius='0px' style={{minHeight: '60px'}} backgroundColor="var(--color-error)">
        <Text variant="heading3">Permanently Delete Tree</Text>
      </Card>
      <FlexContainer style={{overflowX: 'hidden'}} padding='5px 16px 16px 16px' direction="column" gap="5px">
        <Divider />
        <Text variant="p">
          This action is irreversible. Once deleted, the tree and all its data will be permanently removed from our servers.
        </Text>
        <Text variant="p">
          To confirm deletion, please type the family name "{familyName}" below:
        </Text>
        <TextInput
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={`Type "${familyName}" to confirm`}
        />
        <Row padding='0px' justifyContent="flex-end" gap="10px" margin='20px 0px 0px 0px'>
          <Button fullWidth variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="danger"
            onClick={handleConfirm}
            disabled={confirmationText !== familyName}
          >
            Permanently Delete
          </Button>
        </Row>
      </FlexContainer>
    </Modal>
  );
};

export default PurgeModal;
