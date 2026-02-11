import React from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Spacer from '../Spacer';
import Row from '../../layout/containers/Row';
import Button from '../Button';
import WarningModal from './WarningModal';

const DeleteAttachmentModal = ({ isOpen, onClose, onConfirm, attachmentType = "attachment", isDeleting = false }) => {
  return (
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Attachment"
      message={`Are you sure you want to delete this ${attachmentType}? This action cannot be undone.`}
      confirmText={isDeleting ? "Deleting..." : "Delete"}
      onConfirm={onConfirm}
      isLoading={isDeleting}
    />
  );
};

export default DeleteAttachmentModal;
