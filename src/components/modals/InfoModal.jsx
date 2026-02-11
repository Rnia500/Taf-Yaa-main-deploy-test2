import React from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import FlexContainer from '../../layout/containers/FlexContainer';
import Divider from '../Divider';
import Row from '../../layout/containers/Row';

const InfoModal = ({
  isOpen,
  onClose,
  title = 'Information',
  message = 'This is an informational message.',
  confirmText = 'OK',
  confirmVariant = 'primary',
  ...modalProps
}) => {
  const handleConfirm = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
       <FlexContainer padding='0.5rem'  direction="column" gap="5px">
        <Text variant="h3" color="primary">{title}</Text>
        <Divider />
        <Text variant="p">{message}</Text>
        <Row padding='0px' justifyContent="flex-end" gap="10px" margin="20px 0px 0px 0px">
          <Button fullWidth variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </Row>
      </FlexContainer>
    </Modal>
  );
};

export default InfoModal;
