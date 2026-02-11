import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../../components/Button';
import Text from '../../components/Text';
import Card from '../../layout/containers/Card';
import Spacer from '../Spacer'
import Row from '../../layout/containers/Row'
import Column from '../../layout/containers/Column'
import { TextInput } from '../../components/Input';
import dataService from '../../services/dataService';
import useToastStore from '../../store/useToastStore';
import useModalStore from '../../store/useModalStore';
import UndoCountdown from '../UndoCountdown';

export const DeletePersonModal = ({ isOpen, onClose, person, onDeleteComplete }) => {
  const [mode, setMode] = useState('soft');
  const [preview, setPreview] = useState({ peopleIds: [], marriageIds: [] });
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deletionInfo, setDeletionInfo] = useState(null);
  const addToast = useToastStore(state => state.addToast);
  const { openModal, closeModal } = useModalStore();

  useEffect(() => {
    if (!person || !isOpen) return;

    const loadPreview = async () => {
      if (mode === 'cascade') {
        try {
          const previewData = await dataService.previewCascadeDelete(person.id);
          setPreview(previewData);
        } catch (error) {
          console.error('Failed to load preview:', error);
          setPreview({ peopleIds: [], marriageIds: [] });
        }
      } else {
        setPreview({ peopleIds: [person.id], marriageIds: [] });
      }
    };

    loadPreview();
  }, [person, mode, isOpen]);

  const handleDelete = async () => {
    if (!person) return;
    setIsLoading(true);
    try {
      const result = await dataService.deletePerson(person.id, mode, { undoWindowDays: 30 });
      
      // Set deletion info for undo countdown
      setDeletionInfo({
        personId: person.id,
        mode: mode,
        undoExpiresAt: result.undoExpiresAt,
        affectedCount: mode === 'cascade' ? result.deletedIds?.length || 0 : 1,
        marriageCount: result.deletedMarriageIds?.length || 0
      });
      
      addToast(`Person ${mode === 'soft' ? 'replaced with placeholder' : 'and descendants marked deleted'}. Undo available for 30 days.`, 'success');
      if (onDeleteComplete) onDeleteComplete(result);
      onClose();
    } catch (error) {
      addToast(`Failed to delete person: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndoComplete = () => {
    setDeletionInfo(null);
    if (onDeleteComplete) onDeleteComplete({ action: 'undo' });
  };

  const handleCascadeWarning = () => {
    const warningMessage = `This action will permanently delete ${person?.name} and ALL their descendants, marriages, and related family connections. This affects ${preview.peopleIds.length} people and ${preview.marriageIds.length} marriages. This action is irreversible and will break family relationships. Are you absolutely sure you want to proceed?`;
    
    openModal('warningModal', {
      title: '⚠️ Cascade Delete Warning',
      message: warningMessage,
      confirmText: 'Yes, Delete Everything',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        closeModal('warningModal');
        setShowConfirmation(true);
      },
      onCancel: () => {
        closeModal('warningModal');
      }
    });
  };

  const handleContinue = () => {
    if (mode === 'cascade') {
      handleCascadeWarning();
    } else {
      setShowConfirmation(true);
    }
  };

  const requiredText = person?.name;
  const normalizeText = (text) => text?.trim().replace(/\s+/g, ' ').toLowerCase() || '';
  const isConfirmationValid = person && normalizeText(confirmationText) === normalizeText(person.name);


  return (
    <Modal isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <Column margin='25px 0px 0px 0px' padding='0px' gap='1rem'>
        <Text as="h2" variant="h3" bold>Delete Person</Text>
        <Text as="h3" variant="h5">{person?.name || 'Unknown Person'}</Text>
        <Text variant="caption" color="gray-dark">Choose deletion mode. Both are undoable for 30 days.</Text>

        {/* Mode Selection Cards */}
        <Row padding='0.5rem' margin='0px'>
          <Card
            height='150px'
            style={{
              border: mode === 'soft' ? '2px solid var(--color-primary)' : '2px solid var(--color-gray-light)',
              background: mode === 'soft' ? 'var(--color-primary-light)' : 'var(--color-white)'
            }}
            onClick={() => setMode('soft')}
          >
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <Text bold variant="h6">Soft Delete</Text>
              <Spacer size='sm' />
              <Text variant="caption1" align='start' paragraph color="gray-dark">This mode replace the person with placeholder and Keeps relationships intact</Text>
            </div>
          </Card>

          <Card
            height='150px'
            style={{
              border: mode === 'cascade' ? '2px solid var(--color-danger)' : '2px solid var(--color-gray-light)',
              background: mode === 'cascade' ? 'var(--color-danger-light)' : 'var(--color-white)'
            }}
            onClick={() => setMode('cascade')}
          >
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <Text bold variant="h6">Cascade Delete</Text>
              <Spacer size='sm' />
              <Text variant="caption1" color="gray-dark">This mode Complely Removes entire lineage of That person this includes descendants, marriges etc...</Text>
            </div>
          </Card>
        </Row>

        {/* Preview Card for Cascade */}
        {mode === 'cascade' && (
          <Card backgroundColor='var(--color-warning-light)' borderColor='var(--color-warning1)' >
            <div style={{ padding: '12px' }}>
              <Text bold variant="heading3">⚠️ This will affect:</Text>
              <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                <Text><strong>{preview.peopleIds.length}</strong> people</Text>
                <Text><strong>{preview.marriageIds.length}</strong> marriages</Text>
              </div>
            </div>
          </Card>
        )}

        {!showConfirmation ? (
          <Row margin='0px' padding='10px 0px 0px 0px'>
            <Button fullWidth variant="secondary" onClick={onClose}>Cancel</Button>
            <Button fullWidth variant="primary" onClick={handleContinue}>Continue</Button>
          </Row>
        ) : (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Card backgroundColor='var(--color-gray-ultralight)' borderColor='var(--color-gray)'>

              <Text bold color="danger" align='center' variant="heading3">Final Confirmation</Text>
              <Spacer size='sm' />
              <Text >Type <strong>{requiredText}</strong> to confirm deletion:</Text>
              <Spacer size='sm' />
              <TextInput
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type ${requiredText}`}
              />


            </Card>

            <Row  padding='10px 0px 0px 0px' >
              <Button fullWidth variant="secondary" onClick={() => setShowConfirmation(false)}>Back</Button>
              <Button fullWidth variant="danger" onClick={handleDelete} disabled={!isConfirmationValid || isLoading} loading={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete Person'}
              </Button>
            </Row>
          </div>
        )}
      </Column>
      
      {/* Undo Countdown */}
      {deletionInfo && (
        <UndoCountdown 
          deletionInfo={deletionInfo} 
          onUndoComplete={handleUndoComplete}
        />
      )}
    </Modal>
  );
};

// export default DeletePersonModal;