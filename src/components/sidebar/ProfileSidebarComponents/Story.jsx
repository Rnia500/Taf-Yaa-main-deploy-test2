import { React, useState } from 'react';
import Card from '../../../layout/containers/Card';
import Text from '../../Text';
import Spacer from '../../Spacer';
import Row from '../../../layout/containers/Row';
import Button from '../../Button';
import StoryCard from '../../StoryCard';
import StoryModal from '../../modals/StoryModal';
import CreateStoryModal from '../../modals/CreateStoryModal';

function Stories({ stories = [], onRecord, _onTranscribe, isSideBar = true, showRecordButton = true, selectedIndex = null, onSelect = () => {}, personId, treeId, addedBy, onStoriesUpdate }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  const handleStoryClick = (story, index) => {
    setSelectedStory(story);
    setIsModalOpen(true);
    onSelect && onSelect(index);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  const handleCreateStory = () => {
    setEditingStory(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingStory(null);
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setIsCreateModalOpen(true);
  };

  const handleDeleteStory = (storyId) => {
    // Remove the story from the local state
    if (onStoriesUpdate) {
      const updatedStories = stories.filter(story => story.id !== storyId);
      onStoriesUpdate(updatedStories);
    }
  };

  const bgColor = isSideBar ? "var(--color-background)" : "var(--color-transparent)"

  return (
    <>
      <Card alignItems='start' padding='0rem' backgroundColor={bgColor}>
        {isSideBar && <Text variant='heading3'>Stories</Text>}
        <Spacer size='md' />

        <Card alignItems='flex-start' scrolling="horizontal" padding="0px 0px 0px 10px" margin='0px' backgroundColor="var(--color-transparent)" width='100%'>
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
                onEdit={handleEditStory}
                onDelete={handleDeleteStory}
              />
            ))}
          </Row>
        </Card>

        <Spacer size='sm' />
        {showRecordButton && (
          <Row gap='1rem' padding='0.5rem'>
            <Button variant='primary' fullWidth onClick={handleCreateStory}>
              Create Story
            </Button>
          </Row>
        )}
      </Card>

      {/* Story Modal */}
      <StoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        story={selectedStory}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        personId={personId}
        treeId={treeId}
        addedBy={addedBy}
        editingStory={editingStory}
      />
    </>
  );
}

export default Stories
