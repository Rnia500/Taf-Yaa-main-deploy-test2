import React, { useState, useEffect } from 'react';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Text from '../Text';
import Button from '../Button';
import { reviewJoinRequest, acceptJoinRequest } from '../../services/joinRequestService';
import { useAuth } from '../../context/AuthContext';
import useToastStore from '../../store/useToastStore';
import dataService from '../../services/dataService';
import { authService } from '../../services/authService';
import { VideoAttachmentCard, ImageAttachmentCard, AudioAttachmentCard, FileAttachmentCard } from '../AttachmentCard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ConfirmationModal from '../modals/ConfirmationModal';
import WarningModal from '../modals/WarningModal';

const JoinRequestDetails = ({ notification, onRefresh, onClose }) => {
  const { currentUser } = useAuth();
  const addToast = useToastStore(state => state.addToast);
  const [claimedFather, setClaimedFather] = useState(null);
  const [claimedMother, setClaimedMother] = useState(null);
  const [inviteType, setInviteType] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewerName, setReviewerName] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (notification && notification.requestData) {
        try {
          // Fetch claimed father name
          if (notification.requestData.claimedFatherId) {
            const father = await dataService.getPerson(notification.requestData.claimedFatherId);
            setClaimedFather(father);
          }

          // Fetch claimed mother name
          if (notification.requestData.claimedMotherId) {
            const mother = await dataService.getPerson(notification.requestData.claimedMotherId);
            setClaimedMother(mother);
          }

          // Fetch invite type
          if (notification.requestData.inviteId) {
            const inviteRef = doc(db, 'invites', notification.requestData.inviteId);
            const inviteDoc = await getDoc(inviteRef);
            if (inviteDoc.exists) {
              const inviteData = inviteDoc.data();
              setInviteType(inviteData.type);
            }
          }

          // Fetch reviewer name if request is approved or rejected
          if (notification.requestData.reviewedBy && (notification.requestData.status === 'approved' || notification.requestData.status === 'rejected')) {
            const reviewer = await authService.getUserById(notification.requestData.reviewedBy);
            setReviewerName(reviewer?.displayName || 'Unknown User');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [notification]);

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!notification.requestData) return;

    setIsProcessing(true);
    try {
      // Check user permissions before approving
      const tree = await dataService.getTree(notification.requestData.treeId);
      const userRole = tree?.roles?.[currentUser.uid];

      if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
        addToast('You do not have permission to approve this request.', 'error');
        return;
      }

      await acceptJoinRequest(notification.requestData.JoinRequestId, currentUser.uid);
      addToast('Join request approved successfully', 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
      addToast('Failed to approve join request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!notification.requestData) return;

    setIsProcessing(true);
    try {
      await reviewJoinRequest(notification.requestData.JoinRequestId, 'rejected', currentUser.uid);
      addToast('Join request rejected', 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      addToast('Failed to reject join request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const request = notification.requestData;

  return (
    <Column gap="1rem" padding="0px 0px 3rem 0px" margin="0">
      {/* Basic Information */}
      <Card padding="16px" backgroundColor="var(--color-white)">
        <Column gap="12px" padding="0" margin="0">
          <Column gap="16px" padding="0px" margin="0px">
            <Row padding="0px" margin="0px" justifyContent="flex-start">
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Requester Name</Text>
                <Text variant="body2">{request?.name}</Text>
              </Column>
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Gender</Text>
                <Text variant="body2" style={{ textTransform: 'capitalize' }}>{request?.gender}</Text>
              </Column>
            </Row>

            <Row padding="0px" margin="0px" justifyContent="flex-start">
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Birth Date</Text>
                <Text variant="body2">{request?.birthDate ? new Date(request.birthDate).toLocaleDateString() : 'N/A'}</Text>
              </Column>
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Number of Attachments</Text>
                <Text variant="body2" align='center'>{request?.proofFiles?.length || 0}</Text>
              </Column>
            </Row>

            <Row padding="0px" margin="0px" justifyContent="flex-start">
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Date Created</Text>
                <Text variant="body2">{new Date(request?.createdAt).toLocaleDateString()}</Text>
              </Column>
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Invite Code</Text>
                <Text variant="body2">{request?.inviteCode}</Text>
              </Column>
            </Row>

            <Row padding="0px" margin="0px" justifyContent="flex-start">
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Claimed Father</Text>
                <Text variant="body2">{claimedFather?.name || '??'}</Text>
              </Column>
              <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
                <Text variant="caption2" color="gray">Claimed Mother</Text>
                <Text variant="body2">{claimedMother?.name || '??'}</Text>
              </Column>
            </Row>
          </Column>
        </Column>
      </Card>

      {/* Notes Section */}
      {request?.notes && (
        <Card padding="16px" backgroundColor="var(--color-white)">
          <Column gap="8px" padding="0" margin="0">
            <Text bold variant='body2'>Notes from Requester</Text>
            <Card alignItems='flex-start' backgroundColor='var(--color-light-blue)' padding="12px">
              <Text
                as='p'
                variant='body2'
                style={{
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }} 
              >
                {request.notes}
              </Text>
            </Card>
          </Column>
        </Card>
      )}

      {/* Attachments Section */}
      <Card padding="16px" backgroundColor="var(--color-white)">
        <Column gap="12px" padding="0" margin="0">
          <Text bold variant='body2'>Attached Proof Files</Text>
          <Card alignItems='flex-start' scrolling="horizontal" padding="10px 0px 10px 0px" margin='0px' backgroundColor="var(--color-transparent)" width='100%'>
            <Row margin='0px 0px 0px 0px' gap="1rem" padding="0" width="max-content" justifyContent="start" alignItems="start">
              {request?.proofFiles && request.proofFiles.length > 0 ? (
                request.proofFiles.map((file, index) => {
                  if (file.type === 'image') {
                    return (
                      <ImageAttachmentCard
                        key={index}
                        showAuthor={false}
                        showCaption={false}
                        showDeletButton ={false}
                        src={file.url}
                        alt={file.name || `Proof ${index + 1}`}
                        caption={file.name || `Proof ${index + 1}`}
                        onClick={() => window.open(file.url, '_blank')}
                      />
                    );
                  } else if (file.type === 'video') {
                    return (
                      <VideoAttachmentCard
                        key={index}
                        showAuthor={false}
                        showDeletButton ={false}
                        src={file.url.replace(/\.[^/.]+$/, '.jpg')}
                        alt={file.name || `Proof ${index + 1}`}
                        caption={file.name || `Proof ${index + 1}`}
                        onClick={() => window.open(file.url, '_blank')}
                        duration={request.duration || ''}
                      />
                    );
                  } else if (file.type === 'audio') {
                    return (
                      <AudioAttachmentCard
                        key={index}
                        showDeletButton ={false}
                        showAuthor={false}
                        src={file.url.replace(/\.[^/.]+$/, '.jpg')}
                        title={file.name || `Proof ${index + 1}`}
                        onClick={() => window.open(file.url, '_blank')}
                        duration={request.duration || ''}
                      />
                    );
                  } else {
                    // PDF or other file types
                    return (
                      <FileAttachmentCard
                        showAuthor={false}
                        showDeletButton ={false}
                        key={index}
                        fileUrl={file.url}
                        fileName={file.name || `Proof ${index + 1}`}
                        onClick={() => window.open(file.url, '_blank')}
                      />
                    );
                  }
                })
              ) : (
                <Text variant="body2" color="gray">No proof files attached</Text>
              )}
            </Row>
          </Card>
        </Column>
      </Card>

      {/* Action Buttons or Status Display */}

      {inviteType === 'grant' && request?.status === 'pending' && (
        <Card backgroundColor='var(--color-transparent)' padding='0px 2rem 0px 2rem' margin='0px'>
          <Button size='sm' fullWidth variant='danger' onClick={handleRejectClick} disabled={isProcessing}>
              Cancel Request
          </Button>
        </Card>
      )}

      {request?.status === 'pending' && inviteType !== 'grant' && (
        <Row padding='0px' margin='0px' gap="8px">
          <Button size='sm' fullWidth variant='primary' onClick={handleApproveClick} disabled={isProcessing}>
            Accept Request
          </Button>
          <Button size='sm' fullWidth variant='danger' onClick={handleRejectClick} disabled={isProcessing}>
            Reject Request
          </Button>
        </Row>
      )}

      {/* Status Display for Approved/Rejected Requests */}
      {(request?.status === 'approved' || request?.status === 'rejected') && (
        <Card
          padding="12px"
          backgroundColor={request.status === 'approved' ? 'var(--color-success-light)' : 'var(--color-danger-light)'}
          margin="0"
        >
          <Text variant="body2" bold>
            {request.status === 'approved' ? 'Approved' : 'Rejected'} by {reviewerName} on {new Date(request.reviewedAt).toLocaleDateString()}
          </Text>
        </Card>
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Confirm Approval"
        message={`Are you sure you want to approve ${request?.name}'s join request? This will add them as a member to the family tree and they will be able to view and edit family information.`}
        confirmText="Approve"
        confirmVariant="primary"
        onConfirm={handleApproveConfirm}
      />

      <WarningModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Confirm Rejection"
        message={`Are you sure you want to reject ${request?.name}'s join request? This action cannot be undone and they will need to submit a new request if they want to join again.`}
        confirmText="Reject"
        confirmVariant="danger"
        onConfirm={handleRejectConfirm}
      />
    </Column>
  );
};

export default JoinRequestDetails;
