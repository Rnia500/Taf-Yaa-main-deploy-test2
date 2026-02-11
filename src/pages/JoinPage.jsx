import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import Button from '../components/Button';
import { TextInput } from '../components/Input';
import { validateInviteCode } from '../services/inviteService';
import useToastStore from '../store/useToastStore';
import { useAuth } from '../context/AuthContext';
import { QrCode, Keyboard, CheckCircle, XCircle, LogIn } from 'lucide-react';
import CustomQrScanner from '../components/CustomQrScanner';

const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useToastStore(state => state.addToast);
  const { currentUser } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);

  // Pre-fill code from URL if present
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
      validateCode(codeFromUrl);
    }
  }, [searchParams]);

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
    console.log('Current user ID:', currentUser?.uid);
    if (inviteData) {
      if (!currentUser) {
        // Store invite data in sessionStorage for resume after login
        sessionStorage.setItem('pendingJoinInvite', JSON.stringify({
          inviteId: inviteData.inviteId,
          code: inviteData.invite.code,
          invite: inviteData.invite
        }));
        // Redirect to login with return URL
        navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      // For grant type invites, directly add the user to the tree without join request
      if (inviteData.invite.type === 'grant') {
        handleGrantInvite();
        return;
      }

      // Navigate to join request form with invite data
      navigate(`/join-request?inviteId=${inviteData.inviteId}&code=${inviteData.invite.code}`);
    }
  };

  const handleGrantInvite = async () => {
    try {
      // Import the acceptJoinRequest function
      const { acceptJoinRequest } = await import('../services/joinRequestService');

      // Create a mock join request for grant invites
      const mockJoinRequest = {
        treeId: inviteData.invite.treeId,
        inviteCode: inviteData.invite.code,
        inviteId: inviteData.inviteId,
        submittedBy: currentUser.uid,
        claimedFatherId: inviteData.invite.fatherId || null,
        claimedMotherId: inviteData.invite.motherId || null,
        name: currentUser.displayName || currentUser.email || 'Unknown User',
        gender: 'male', // Default, can be updated later
        birthDate: null,
        notes: 'Auto-approved grant membership',
        proofFiles: [] // No proof files needed for grants
      };

      // Submit the mock join request
      const { submitJoinRequest } = await import('../services/joinRequestService');
      const joinRequest = await submitJoinRequest(mockJoinRequest);

      // Auto-approve the join request
      await acceptJoinRequest(joinRequest.JoinRequestId, currentUser.uid);

      addToast('Successfully joined the family tree!', 'success');
      navigate(`/tree/${inviteData.invite.treeId}`);
    } catch (error) {
      console.error('Failed to process grant invite:', error);
      addToast('Failed to join the family tree', 'error');
    }
  };

  return (
    <FlexContainer direction="vertical" padding="0px" gap="20px" align="center" minHeight="100vh">
      <Card padding="10px" maxWidth="600px" alignItems='center' justifyContent='center' width="100%">
        <FlexContainer padding='0px' direction="vertical" gap="30px" align="center">
          <Text variant="heading1" textAlign="center">Join Family Tree</Text>

          {!inviteData && !error && (
            <>
              <Text variant="body1" textAlign="center" color="gray">
                Enter your invitation code or scan the QR code to join a family tree.
              </Text>

              {/* Manual Code Entry */}
              <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
                <FlexContainer direction="vertical" gap="15px">
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

              <Text variant="body2" textAlign="center" color="gray">or</Text>

              {/* QR Code Scanner */}
              {!scanning ? (
                <Button
                  variant="ghost"
                  backgroundColor="var(--color-gray)"
                  onClick={() => setScanning(true)}
                  fullWidth
                >
                  <QrCode size={16} style={{ marginRight: '8px' }} />
                  Scan QR Code
                </Button>
              ) : (
                <div style={{ width: '300px', height: '300px', marginTop: '-20px' }}>
                  <CustomQrScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setScanning(false)}
                  />
                </div>
              )}
            </>
          )}

          {/* Error Display */}
          {error && (
            <FlexContainer direction="vertical" gap="15px" align="center">
              <XCircle size={48} color="var(--color-error)" />
              <Text variant="body1" color="var(--color-error)" textAlign="center">
                {error}
              </Text>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setInviteData(null);
                  setInviteCode('');
                }}
              >
                Try Again
              </Button>
            </FlexContainer>
          )}

          {/* Success Display */}
          {inviteData && (
            <FlexContainer direction="vertical" gap="20px" align="center">
              <CheckCircle size={48} color="var(--color-success)" />
              <Text variant="heading3" textAlign="center">
                Valid Invitation Found!
              </Text>
              <Card padding="20px" backgroundColor="var(--color-success-light)">
                <FlexContainer direction="vertical" gap="10px">
                  <Text variant="body2">
                    <strong>Family Name:</strong> {inviteData.tree?.familyName || 'Unknown Family'}
                  </Text>
                  <Text variant="body2">
                    <strong>Role:</strong> {inviteData.invite.role}
                  </Text>
                  <Text variant="body2">
                    <strong>Type:</strong> {inviteData.invite.type}
                  </Text>
                  {inviteData.invite.notes && (
                    <Text variant="body2">
                      <strong>Notes:</strong> {inviteData.invite.notes}
                    </Text>
                  )}
                </FlexContainer>
              </Card>
              <Button
                variant="primary"
                onClick={proceedToJoinRequest}
                fullWidth
              >
                Proceed to Join Request
              </Button>
            </FlexContainer>
          )}
        </FlexContainer>
      </Card>
    </FlexContainer>
  );
};

export default JoinPage;
