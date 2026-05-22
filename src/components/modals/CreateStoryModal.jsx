import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Spacer from '../Spacer';
import Row from '../../layout/containers/Row';
import Button from '../Button';
import { TextInput, TextArea } from '../Input';
import dataService from '../../services/dataService';

const CreateStoryModal = ({ isOpen, onClose, personId, treeId, addedBy, editingStory }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (editingStory) {
      setTitle(editingStory.title || '');
      setDescription(editingStory.description || '');
      setLocation(editingStory.location || '');
      setTime(editingStory.time || '');
      setTags(editingStory.tags ? editingStory.tags.join(', ') : '');
    } else {
      // Reset form for new story
      setTitle('');
      setDescription('');
      setLocation('');
      setTime('');
      setTags('');
    }
  }, [editingStory, isOpen]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setTime('');
    setTags('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (editingStory) {
        // Update existing story
        const updatedData = {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          time: time.trim() || null,
          tags: parsedTags.length ? parsedTags : null,
        };

        await dataService.updateStory(editingStory.id, updatedData);
      } else {
        // Create new story
        const storyData = {
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          personId,
          treeId,
          createdBy: addedBy,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          time: time.trim() || null,
          tags: parsedTags.length ? parsedTags : null,
          attachments: [],
          contributors: [addedBy],
          active: true,
        };

        await dataService.addStory(storyData);
      }

      // Trigger data reload in parent components
      window.dispatchEvent(new Event('familyDataChanged'));
      handleClose();
    } catch (err) {
      console.error('Failed to save story:', err);
      setError(`Failed to ${editingStory ? 'update' : 'create'} story. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="600px">
      <Card fitContent padding='10px' backgroundColor="var(--color-transparent)">
        <Text variant='heading2'>{editingStory ? 'Edit Story' : 'Create New Story'}</Text>
        <Spacer size='lg' />

        <TextInput
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter story title"
          required
        />
        <Spacer size='md' />

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story..."
          rows={4}
        />
        <Spacer size='md' />

        <Row gap='1rem' padding='0px' margin='0px'>
          <TextInput
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Nairobi, Kenya"
          />
          <TextInput
            label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g., 1995, Summer 2020"
          />
        </Row>
        <Spacer size='md' />

        <TextInput
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated (e.g., family, childhood, celebration)"
        />
        <Spacer size='lg' />

        {error && (
          <Text variant='body2' color='error' style={{ textAlign: 'center' }}>
            {error}
          </Text>
        )}
        <Spacer size='md' />

        <Row gap='1rem'  justifyContent='flex-end'>
          <Button fullWidth variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button fullWidth variant='primary' onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (editingStory ? 'Updating...' : 'Creating...') : (editingStory ? 'Update Story' : 'Create Story')}
          </Button>
        </Row>
      </Card>
    </Modal>
  );
};

export default CreateStoryModal;
