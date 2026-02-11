import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Spacer from '../Spacer';
import Divider from '../Divider';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Button from '../Button';
import { VideoAttachmentCard, ImageAttachmentCard, AudioAttachmentCard } from '../AttachmentCard';
import { authService } from '../../services/authService';
import dataService from '../../services/dataService';
import AddAttachmentModal from './AddAttachmentModal';
import RelativesCardList from '../sidebar/ProfileSidebarComponents/people/RelativesCardList';

const StoryModal = ({ isOpen, onClose, story }) => {
  const [contributors, setContributors] = useState([]);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [currentStory, setCurrentStory] = useState(story);

  const handleAddAttachment = () => {
    setIsAddAttachmentModalOpen(true);
  };

  const handleAttachmentAdded = async (attachment) => {
    try {
      // Update the story with the new attachment
      const updatedAttachments = [...(currentStory.attachments || []), attachment];
      await dataService.updateStory(currentStory.id, { attachments: updatedAttachments });

      // Update local state to reflect the change immediately
      setCurrentStory(prev => ({
        ...prev,
        attachments: updatedAttachments
      }));

      // Trigger data reload in parent components
      window.dispatchEvent(new Event('familyDataChanged'));

      console.log('Attachment added to story:', attachment);
      // Close the attachment modal
      setIsAddAttachmentModalOpen(false);
    } catch (error) {
      console.error('Failed to add attachment to story:', error);
    }
  };

  const handleAttachmentDelete = async (attachmentId) => {
    try {
      // Remove the attachment from the current story
      const updatedAttachments = currentStory.attachments.filter(att => att.attachmentId !== attachmentId);
      await dataService.updateStory(currentStory.id, { attachments: updatedAttachments });

      // Update local state to reflect the change immediately
      setCurrentStory(prev => ({
        ...prev,
        attachments: updatedAttachments
      }));

      // Trigger data reload in parent components
      window.dispatchEvent(new Event('familyDataChanged'));

      console.log('Attachment deleted from story:', attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment from story:', error);
    }
  };

  useEffect(() => {
    const fetchContributors = async () => {
      if (!currentStory?.contributors) {
        setContributors([]);
        return;
      }

      try {
        const contributorPromises = currentStory.contributors.map(async (userId) => {
          const userData = await authService.getUserById(userId);

          // Count attachments by this user
          const attachmentCount = currentStory.attachments?.filter(att => att.uploadedBy === userId).length || 0;
          // Story creation counts as one contribution
          const isCreator = userId === currentStory.createdBy;
          const totalContributions = attachmentCount + (isCreator ? 1 : 0);

          return {
            name: userData?.displayName || 'Unknown',
            avatarUrl: userData?.profilePhoto || 'https://via.placeholder.com/40',
            userId,
            attachmentCount,
            isCreator,
            totalContributions
          };
        });

        const contributorData = await Promise.all(contributorPromises);
        // Remove duplicates by userId and sort by total contributions (descending)
        const uniqueContributors = contributorData
          .filter((contributor, index, self) =>
            index === self.findIndex(c => c.userId === contributor.userId)
          )
          .sort((a, b) => b.totalContributions - a.totalContributions);

        setContributors(uniqueContributors);
      } catch (error) {
        console.error('Error fetching contributors:', error);
        setContributors([]);
      }
    };

    if (isOpen && currentStory) {
      fetchContributors();
    }
  }, [isOpen, currentStory]);

  // Sync currentStory with prop changes
  useEffect(() => {
    setCurrentStory(story);
  }, [story]);

  if (!story || !currentStory) return null;

  const handleAttachmentClick = (attachment) => {
    window.open(attachment.url, '_blank');
  };

  // Assume story object now has location, time, and people properties
  const {
    title,
    description,
    attachments,
    location,
    time,
  } = currentStory;

  return (
    <>
      <Modal isOpen={isOpen} title={title} onClose={onClose} maxHeight="90vh" width="800px">

        <Card backgroundColor='var(--color-transparent)' alignItems='flex start' width='100%' padding='0px' margin='0px'>
          <Text as='span' paragraph variant="body1" color="secondary-text">{description}</Text>
        </Card>

        <Spacer size='lg' />
        {/* Metadata Section */}
        <Row justifyContent="start" padding='0px' margin='0px' alignItems="start" gap="3rem">
          <Column padding='0px' margin='0px' alignItems="start" gap="0.5rem">
            <Text variant="caption1" color="tertiary-text" uppercase>LOCATION</Text>
            <Text variant="caption1" color="primary">{location || 'Not specified'}</Text>
          </Column>
          <Column padding='0px' margin='0px' alignItems="start" gap="0.5rem">
            <Text variant="caption1" color="tertiary-text" uppercase>TIME</Text>
            <Text variant="caption1" color="primary">{time || 'Not specified'}</Text>
          </Column>
          <Column padding='0px' margin='0px' alignItems="start" gap="0.5rem">
            <Text variant="caption1" color="tertiary-text" uppercase>Contributors</Text>
            <RelativesCardList
              relatives={contributors.map(person => ({
                id: person.userId,
                image: person.avatarUrl,
                name: person.name,
                tooltip: `${person.name} (${person.isCreator ? 'Creator' : 'Contributor'}) 📎${person.attachmentCount}`
              }))}
              stacked={contributors.length > 1}
            />
          </Column>
        </Row>

        <Spacer size='lg' />

        {/* Attachments Section */}
        {attachments && attachments.length > 0 && (
          <Column alignItems="start" padding='0px' margin='0px' gap="1rem">
            <Text variant="caption1" color="tertiary-text" uppercase>ATTACHMENTS</Text>
            <Card alignItems='flex-start' scrolling="horizontal" padding="0px 0px 0px 0px" margin='0px' backgroundColor="var(--color-transparent)" width='100%'>
              <Row margin='0px 0px 0px 0px' gap="0.5rem" padding="0" width="max-content" justifyContent="start" alignItems="start">
                {attachments.map((attachment) => {
                  const commonProps = {
                    onClick: () => handleAttachmentClick(attachment),
                    style: { width: '120px', height: '120px' }
                  };

                  if (attachment.type === 'image') {
                    return (
                      <ImageAttachmentCard
                        key={attachment.attachmentId}
                        src={attachment.url}
                        alt={attachment.caption || "Image"}
                        uploader={attachment.uploadedBy}
                        onDelete={handleAttachmentDelete}
                        attachmentId={attachment.attachmentId}
                        {...commonProps}
                      />
                    );
                  } else if (attachment.type === 'video') {
                    return (
                      <VideoAttachmentCard
                        key={attachment.attachmentId}
                        src={attachment.url.replace(/\.[^/.]+$/, '.jpg')}
                        alt={attachment.caption || "Video"}
                        duration={attachment.duration}
                        uploader={attachment.uploadedBy}
                        onDelete={handleAttachmentDelete}
                        attachmentId={attachment.attachmentId}
                        {...commonProps}
                      />
                    );
                  } else if (attachment.type === 'audio') {
                    return (
                      <AudioAttachmentCard
                        key={attachment.attachmentId}
                        duration={attachment.duration}
                        title={attachment.caption || 'Audio'}
                        uploader={attachment.uploadedBy}
                        onDelete={handleAttachmentDelete}
                        attachmentId={attachment.attachmentId}
                        {...commonProps}
                      />
                    );
                  } else {
                    // Fallback for other file types or generic attachment
                    return (
                      <Card key={attachment.attachmentId} {...commonProps} style={{ ...commonProps.style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                        {/* Add a generic file icon here */}
                        <Text>File</Text>
                      </Card>
                    );
                  }
                })}
              </Row>
            </Card>
          </Column>
        )}

        <Row padding='0px' margin='0px' justifyContent="center" width="100%">
          <Button variant="primary" fullWidth onClick={handleAddAttachment} style={{ marginTop: '1rem' }}>
             Add Attachment
          </Button>
        </Row>
      </Modal>

      <AddAttachmentModal
        isOpen={isAddAttachmentModalOpen}
        onClose={() => setIsAddAttachmentModalOpen(false)}
        onAttachmentAdded={handleAttachmentAdded}
        storyTitle={title}
      />
    </>
  );
};

export default StoryModal;
