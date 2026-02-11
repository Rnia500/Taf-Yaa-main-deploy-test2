import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import FlexContainer from '../../layout/containers/FlexContainer';
import Text from '../Text';
import Card from '../../layout/containers/Card';
import Button from '../Button';
import { TextInput } from '../Input';
import { validateInviteCode } from '../../services/inviteService';
import useToastStore from '../../store/useToastStore';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Keyboard, CheckCircle, XCircle } from 'lucide-react';
import CustomQrScanner from '../CustomQrScanner';

const JoinModal = ({ isOpen, onClose }) => {
  const addToast = useToastStore(state => state.addToast);
  const { currentUser } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInviteCode('');
      setScanning(false);
      setValidating(false);
      setInviteData(null);
      setError(null);
    }
  }, [isOpen]);

  const validateCode = async (code) => {
    if (!code.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    setValidating(true);
    setError(null);
    setInviteData(null);

    try {
      const result = await validateInviteCode(code);
      setInviteData(result);
      addToast('Invitation code is valid!', 'success');
    } catch (err) {
      setError(err.message);
      addToast('Invalid invitation code', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    validateCode(inviteCode);
  };

  const handleScanSuccess = (code) => {
    setInviteCode(code);
    setScanning(false);
    validateCode(code);
  };

  const proceedToJoinRequest = () => {
    
    if (inviteData) {
      if (!currentUser) {
        // Store invite data in sessionStorage for resume after login
        sessionStorage.setItem('pendingJoinInvite', JSON.stringify({
          inviteId: inviteData.inviteId,
          code: inviteData.invite.code,
          invite: inviteData.invite
        }));
        // Redirect to login with return URL
        window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        onClose();
        return;
      }
      // Navigate to join request form with invite data
      window.location.href = `/join-request?inviteId=${inviteData.inviteId}&code=${inviteData.invite.code}`;
      onClose();
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setScanning(false);
    setValidating(false);
    setInviteData(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Join Family tree" onClose={handleClose} maxWidth="600px">
      <FlexContainer direction="vertical" gap="30px" align="center" padding="20px">

        {!inviteData && !error && (
          <>
            <Text variant="body1" textAlign="center" color="#64748b" style={{ lineHeight: '1.6' }}>
              Enter your invitation code or scan the QR code to join a family tree.
            </Text>

            {/* Manual Code Entry */}
            <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
              <FlexContainer direction="vertical" gap="20px">
                <TextInput
                  label="Invitation Code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invitation code..."
                  disabled={validating}
                  leadingIcon={<Keyboard size={16} />}
                  
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={validating || !inviteCode.trim()}
                >
                  {validating ? 'Validating...' : 'Validate Code'}
                </Button>
              </FlexContainer>
            </form>

            <Text variant="body2" textAlign="center" color="#94a3b8" style={{ fontWeight: '500' }}>
              or
            </Text>

            {/* QR Code Scanner */}
            {!scanning ? (
              <Button
                variant="ghost"
                onClick={() => setScanning(true)}
                fullWidth
                style={{
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: '2px solid #3b82f6',
                  color: '#3b82f6',
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: '#3b82f6', color: '#ffffff', transform: 'translateY(-1px)' }
                }}
              >
                <QrCode size={18} style={{ marginRight: '10px' }} />
                Scan QR Code
              </Button>
            ) : (
                <CustomQrScanner
                  onScanSuccess={handleScanSuccess}
                  onClose={() => setScanning(false)}
                />
            )}
          </>
        )}

        {/* Error Display */}
        {error && (
          <FlexContainer direction="vertical" gap="20px" align="center">
            <div style={{
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #fecaca',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              width: '100%',
              textAlign: 'center'
            }}>
              <XCircle size={40} color="#dc2626" style={{ marginBottom: '12px' }} />
              <Text variant="body1" color="#dc2626" textAlign="center" style={{ fontWeight: '500' }}>
                {error}
              </Text>
              <Button
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setInviteData(null);
                  setInviteCode('');
                }}
                style={{
                  marginTop: '16px',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  border: '2px solid #dc2626',
                  color: '#dc2626',
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: '#dc2626', color: '#ffffff' }
                }}
              >
                Try Again
              </Button>
            </div>
          </FlexContainer>
        )}

        {/* Success Display */}
        {inviteData && (
          <FlexContainer direction="vertical" gap="25px" align="center">
            <div style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #bbf7d0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              width: '100%',
              textAlign: 'center'
            }}>
              <CheckCircle size={40} color="#16a34a" style={{ marginBottom: '12px' }} />
              <Text variant="heading3" textAlign="center" style={{ color: '#16a34a', marginBottom: '16px' }}>
                Valid Invitation Found!
              </Text>
              <Card
                padding="16px"
                backgroundColor="#ecfdf5"
                style={{
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '16px'
                }}
              >
                <FlexContainer direction="vertical" gap="10px">
                  <Text variant="body2" style={{ fontWeight: '500' }}>
                    <strong>Family Name:</strong> {inviteData.tree?.familyName || 'Unknown Family'}
                  </Text>
                  <Text variant="body2" style={{ fontWeight: '500' }}>
                    <strong>Role:</strong> {inviteData.invite.role}
                  </Text>
                  <Text variant="body2" style={{ fontWeight: '500' }}>
                    <strong>Type:</strong> {inviteData.invite.type}
                  </Text>
                  {inviteData.invite.notes && (
                    <Text variant="body2" style={{ fontWeight: '500' }}>
                      <strong>Notes:</strong> {inviteData.invite.notes}
                    </Text>
                  )}
                </FlexContainer>
              </Card>
              <Button
                variant="primary"
                onClick={proceedToJoinRequest}
                fullWidth
                style={{
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#16a34a',
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: '#15803d', transform: 'translateY(-1px)' }
                }}
              >
                Proceed to Join Request
              </Button>
            </div>
          </FlexContainer>
        )}
      </FlexContainer>
    </Modal>
  );
};

export default JoinModal;
