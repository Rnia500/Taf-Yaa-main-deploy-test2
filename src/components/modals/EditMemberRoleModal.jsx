import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Text from '../Text';
import Button from '../Button';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import SelectDropdown from '../SelectDropdown';
import { treeServiceFirebase } from '../../services/data/treeServiceFirebase';

const EditMemberRoleModal = ({ isOpen, member, treeId, onRoleUpdated, onClose }) => {
  const [selectedRole, setSelectedRole] = useState(member.role || 'viewer');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' }
  ];

  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  const handleFinalConfirm = async () => {
    setLoading(true);
    try {
      await treeServiceFirebase.changeMemberRole(treeId, member.linkedUserId, selectedRole);
      onRoleUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update member role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={() => setShowConfirmation(false)} title="Confirm Role Change">
        <Column gap="20px">
          <Text variant="body1">
            Are you sure you want to change <strong>{member.name}</strong>'s role to <strong>{selectedRole}</strong>?
          </Text>
          <Row justifyContent="flex-end" gap="10px">
            <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFinalConfirm} disabled={loading}>
              {loading ? 'Updating...' : 'Confirm'}
            </Button>
          </Row>
        </Column>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Member Role">
      <Column gap="20px">
        <Text variant="body1">
          Change the role for <strong>{member.name}</strong>.
        </Text>
        <Text variant="body2" color="gray">
          Current role: <strong>{member.role || 'viewer'}</strong>
        </Text>

        <SelectDropdown
          label="Select Role"
          options={roleOptions}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        />

        <Row justifyContent="flex-end" gap="10px">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Update Role
          </Button>
        </Row>
      </Column>
    </Modal>
  );
};

export default EditMemberRoleModal;
