import React from 'react';
import WarningModal from './WarningModal';

const DeleteStoryModal = ({ isOpen, onClose, onConfirm, storyTitle, isDeleting = false }) => {
  const handleConfirm = (dontRemind) => {
    onConfirm(dontRemind);
  };

  return (
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Story"
      message={`Are you sure you want to delete "${storyTitle}"? This action cannot be undone. The story and all its attachments will be permanently removed.`}
      confirmText={isDeleting ? 'Deleting...' : 'Delete Story'}
      cancelText="Cancel"
      confirmVariant="danger"
      cancelVariant="secondary"
    />
  );
};

export default DeleteStoryModal;
