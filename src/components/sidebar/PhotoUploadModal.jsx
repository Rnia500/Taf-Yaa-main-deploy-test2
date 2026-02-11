import React, { useState } from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Row from '../../layout/containers/Row';
import Button from '../Button';
import FileUpload from '../FileUpload';
import dataService from '../../services/dataService';

const PhotoUploadModal = ({ isOpen, onClose, personId }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!file || !personId) return;
    setIsUploading(true);
    setError(null);
    try {
      // Get person to find treeId and userId context
      const person = await dataService.getPerson(personId);
      const treeId = person?.treeId || 'general'; // fallback for general uploads
      const userId = 'current-user'; // TODO: Get from auth context
      
      const uploaded = await dataService.uploadFile(file, 'image', {
        treeId,
        personId,
        userId
      });
      
      const currentPhotos = Array.isArray(person?.photos) ? person.photos.slice() : [];
      currentPhotos.push({ url: uploaded.url, alt: person?.name || 'Photo' });
      await dataService.updatePerson(personId, { photos: currentPhotos });
      try { window.dispatchEvent(new Event('familyDataChanged')); } catch {}
      onClose();
    } catch (e) {
      console.error('PhotoUploadModal -> upload failed', e);
      setError('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <Card fitContent padding='5px' margin='10px 0px' backgroundColor="var(--color-transparent)" position='left'>
        <Text variant='heading2'>Upload Photo</Text>
      </Card>

      <FileUpload accept='image/*' label='Click or drag an image' onChange={(f) => setFile(f)} />

      {error && (
        <div style={{ color: 'red', marginTop: '0.5rem', textAlign: 'center' }}>{error}</div>
      )}

      <Row gap='1rem' padding='0.5rem' margin='0.5rem 0 0 0'>
        <Button variant='secondary' fullWidth onClick={handleCancel} disabled={isUploading}>Cancel</Button>
        <Button fullWidth onClick={handleSubmit} disabled={!file || isUploading}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </Button>
      </Row>
    </Modal>
  );
};

export default PhotoUploadModal; 