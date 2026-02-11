import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Text from '../Text';
import Button from '../Button';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import SelectDropdown from '../SelectDropdown';
import { TextInput } from '../Input';

const BanMemberModal = ({ isOpen, member, treeId: _treeId, onBanConfirmed, onClose }) => {
  const [banType, setBanType] = useState('permanent');
  const [banDuration, setBanDuration] = useState(1);
  const [banUnit, setBanUnit] = useState('days');
  const [loading, setLoading] = useState(false);

  const banTypeOptions = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'temporary', label: 'Temporary' }
  ];

  const unitOptions = [
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' }
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let banPeriod = null;
      if (banType === 'temporary') {
        const now = new Date();
        if (banUnit === 'hours') now.setHours(now.getHours() + banDuration);
        else if (banUnit === 'days') now.setDate(now.getDate() + banDuration);
        else if (banUnit === 'weeks') now.setDate(now.getDate() + banDuration * 7);
        else if (banUnit === 'months') now.setMonth(now.getMonth() + banDuration);
        banPeriod = now.toISOString();
      }
      await onBanConfirmed(member, banPeriod);
      onClose();
    } catch (error) {
      console.error('Failed to ban member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ban Member">
      <Column gap="20px">
        <Text variant="body1">
          Ban <strong>{member.name}</strong> from the tree.
        </Text>

        <SelectDropdown
          label="Ban Type"
          options={banTypeOptions}
          value={banType}
          onChange={(e) => setBanType(e.target.value)}
        />

        {banType === 'temporary' && (
          <Row gap="10px" align="center">
            <TextInput
              type="number"
              min="1"
              value={banDuration.toString()}
              onChange={(e) => setBanDuration(parseInt(e.target.value) || 1)}
              style={{ width: '80px' }}
            />
            <SelectDropdown
              options={unitOptions}
              value={banUnit}
              onChange={(e) => setBanUnit(e.target.value)}
              style={{ width: '120px' }}
            />
          </Row>
        )}

        <Row justifyContent="flex-end" gap="10px">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Banning...' : 'Ban Member'}
          </Button>
        </Row>
      </Column>
    </Modal>
  );
};

export default BanMemberModal;
