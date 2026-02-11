import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Text from '../Text';
import Button from '../Button';
import { Clock, User, Calendar, FileText, Users, MapPin, Check, X } from 'lucide-react';
import { reviewJoinRequest, acceptJoinRequest } from '../../services/joinRequestService';
import { useAuth } from '../../context/AuthContext';
import useToastStore from '../../store/useToastStore';
import dataService from '../../services/dataService';
import { VideoAttachmentCard, ImageAttachmentCard, AudioAttachmentCard, FileAttachmentCard } from '../AttachmentCard';
import Spacer from '../Spacer';
import Divider from '../Divider';

const PendingRequestDetailsModal = ({ isOpen, request, onClose, onRefresh }) => {
  const { currentUser } = useAuth();
  const addToast = useToastStore(state => state.addToast);
  const [claimedFather, setClaimedFather] = useState(null);
  const [claimedMother, setClaimedMother] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (request) {
        try {
          // Fetch claimed father name
          if (request.claimedFatherId) {
            const father = await dataService.getPerson(request.claimedFatherId);
            setClaimedFather(father);
          }

          // Fetch claimed mother name
          if (request.claimedMotherId) {
            const mother = await dataService.getPerson(request.claimedMotherId);
            setClaimedMother(mother);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [request]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await acceptJoinRequest(request.JoinRequestId, currentUser.uid);
      addToast('Join request approved successfully', 'success');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
      addToast('Failed to approve join request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await reviewJoinRequest(request.JoinRequestId, 'rejected', currentUser.uid);
      addToast('Join request rejected', 'success');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      addToast('Failed to reject join request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !request) return null;



  return (
    <Modal
      isOpen={isOpen}
      title="Pending Join Request"
      onClose={onClose}
    >

      {/* DescriptionList Component */}
      <Column gap="16px" padding="0px" margin="0px">
        <Row padding="0px" margin="0px" justifyContent="flex-start">

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Requester Name</Text>
            <Text variant="body1">{request.name}</Text>
          </Column>
          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Gender</Text>
            <Text variant="body1" style={{ textTransform: 'capitalize' }}>{request.gender}</Text>
          </Column>

        </Row>

        <Row padding="0px" margin="0px" justifyContent="flex-start">

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Birth Date</Text>
            <Text variant="body1">{request.birthDate ? new Date(request.birthDate).toLocaleDateString() : 'N/A'}</Text>
          </Column>
          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Number of Attachments</Text>
            <Text variant="body1" align='center'>{request.proofFiles.length}</Text>
          </Column>

        </Row>


        <Row padding="0px" margin="0px" justifyContent="flex-start">

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Date Created</Text>
            <Text variant="body1">{new Date(request.createdAt).toLocaleDateString()}</Text>
          </Column>

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Invite Code</Text>
            <Text variant="body1">{request.inviteCode}</Text>
          </Column>

        </Row>

        <Row padding="0px" margin="0px" justifyContent="flex-start">

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Claimed Father</Text>
            <Text variant="body1">{claimedFather?.name || '??'}</Text>
          </Column>

          <Column fitContent padding="0px" gap='0.3rem' margin="0px" alignItems="flex-start">
            <Text variant="caption1" color="gray">Claimed Mother</Text>
            <Text variant="body1">{claimedMother?.name || '??'}</Text>
          </Column>

        </Row>


      </Column>

       <Spacer size='md' />
      <Divider />
      <Spacer size='md' />
      {/* TextField Component */}
      {request.notes && (
        <>
            <Text bold variant='body2'>Notes from Requester</Text>
            <Card alignItems='flex-start' backgroundColor='var(--color-gray)'>
              <Text as='p' paragraph variant='body2'>{request.notes}</Text>
            </Card>
        
        </>
      )}

      <Spacer size='md' />
      
      <h3 className="px-0 pb-3 pt-2 text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900">Attached Proof Files</h3>

      {/* Attachment Cards */}
      <Card alignItems='flex-start' scrolling="horizontal" padding="0px 0px 0px 0px" margin='0px 0px 2rem 0px' backgroundColor="var(--color-transparent)" width='100%'>
        <Row margin='0px 0px 0px 0px' gap="0.5rem" padding="0" width="max-content" justifyContent="start" alignItems="start">
          {request.proofFiles && request.proofFiles.length > 0 ? (
            request.proofFiles.map((file, index) => {
              if (file.type === 'image') {
                return (
                  <ImageAttachmentCard
                    key={index}
                    showAuthor = {false}
                    showCaption = {false}
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
                    showAuthor = {false}
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
                    showAuthor = {false}
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
                    showAuthor = {false}
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


      {/* Footer Area */}
      <Row padding='0px' margin='0px'>
        <Button fullWidth variant='danger' onClick={handleReject} disabled={request.status !== 'pending' || isProcessing} >
          Reject Request
        </Button>

        <Button fullWidth variant='primary' onClick={handleApprove} disabled={request.status !== 'pending' || isProcessing}>
          Accept Request
        </Button>

      </Row>
    </Modal>
  );
};

export default PendingRequestDetailsModal;
