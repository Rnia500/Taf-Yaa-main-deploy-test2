import React, { useState } from 'react';
import Card from '../layout/containers/Card';
import Text from './Text';
import Button from './Button';
import Row from '../layout/containers/Row';
import StoryCard from './StoryCard';
import StoryModal from './modals/StoryModal';

const StoriesList = ({ stories = [], handleDelete, onChange, onUploadAudio }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteSelected = () => {
    if (selectedIndex === null || selectedIndex < 0) return;
    const updated = (stories || []).filter((_, i) => i !== selectedIndex);
    setSelectedIndex(null);
    onChange && onChange(updated);
    if (handleDelete) handleDelete();
  };

  const handleStoryClick = (story, index) => {
    setSelectedStory(story);
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  return (
    <>
      <Card padding='0px' margin='0px' backgroundColor='var(--color-transparent)'>
        <Text variant='heading3'>Stories</Text>
        <Card alignItems='flex-start' scrolling="horizontal" padding="0px 0px 0px 10px" margin='10px 0px 10px 0px' backgroundColor="var(--color-transparent)" width='100%'>
          {stories.length === 0 && (
            <Text variant='body1' color='tertiary-text'>No stories available.</Text>
          )}
          <Row margin='0px 0px 10px 0px' gap="0.5rem" padding="0" width="max-content" justifyContent="start" alignItems="start">
            {stories.map((story, index) => (
              <StoryCard
                key={story.id || index}
                story={story}
                onClick={(story) => handleStoryClick(story, index)}
                isSelected={selectedIndex === index}
              />
            ))}
          </Row>
        </Card>
      </Card>

      <Row gap="0.5rem" width='100%' padding="0.5rem 20% 0 20%">
        <Button fullWidth variant='primary' onClick={onUploadAudio}>Create Story</Button>
        <Button fullWidth variant="danger" onClick={handleDeleteSelected} disabled={selectedIndex === null}>Delete Selected</Button>
      </Row>

      {/* Story Modal */}
      <StoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        story={selectedStory}
      />
    </>
  );
};

export default StoriesList; 