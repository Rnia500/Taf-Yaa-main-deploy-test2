import React, { useState, useEffect } from 'react';
import { Clock, Undo2 } from 'lucide-react';
import Button from './Button';
import Text from './Text';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import { personServiceLocal } from '../services/data/personServiceLocal';
import useToastStore from '../store/useToastStore';

function UndoCountdown({ deletionInfo, onUndoComplete }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  useEffect(() => {
    if (!deletionInfo?.undoExpiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(deletionInfo.undoExpiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deletionInfo?.undoExpiresAt]);

  const handleUndo = async () => {
    if (!deletionInfo?.personId) return;

    setIsUndoing(true);
    try {
      await personServiceLocal.undoDelete(deletionInfo.personId);
      addToast('Deletion undone successfully!', 'success');
      if (onUndoComplete) onUndoComplete();
    } catch (error) {
      addToast(`Failed to undo deletion: ${error.message}`, 'error');
    } finally {
      setIsUndoing(false);
    }
  };

  if (!timeLeft) return null;

  const formatTime = () => {
    if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`;
    if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  };

  return (
    <Card 
      backgroundColor="var(--color-warning-light)" 
      borderColor="var(--color-warning)"
      style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1000,
        minWidth: '300px'
      }}
    >
      <Column gap="0.5rem" padding="12px">
        <Row gap="0.5rem" align="center">
          <Clock size={16} color="var(--color-warning)" />
          <Text variant="body2" bold>Undo Available</Text>
        </Row>
        
        <Text variant="caption1" color="gray-dark">
          {deletionInfo.mode === 'soft' 
            ? 'Person converted to placeholder' 
            : `${deletionInfo.affectedCount} people and ${deletionInfo.marriageCount} marriages affected`
          }
        </Text>
        
        <Row gap="0.5rem" align="center">
          <Text variant="caption1" bold color="var(--color-warning)">
            Expires in: {formatTime()}
          </Text>
        </Row>
        
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleUndo}
          loading={isUndoing}
          disabled={isUndoing}
        >
          <Undo2 size={14} />
          Undo Deletion
        </Button>
      </Column>
    </Card>
  );
}

export default UndoCountdown;
