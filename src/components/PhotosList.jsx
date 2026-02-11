import React, { useState } from 'react';
import Button from './Button';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import PhotoMemorySection from './sidebar/ProfileSidebarComponents/PhotoMemorySection';

const PhotosList = ({ photos, onChange, onUploadPhoto }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleDelete = () => {
    if (selectedIndex === null || selectedIndex < 0) return;
    const updated = (photos || []).filter((_, i) => i !== selectedIndex);
    setSelectedIndex(null);
    onChange(updated);
  };

  return (
    <div className="photos-list">
      <PhotoMemorySection
        onSelect={() => {}}
        size='120px'
        isSideBar={false}
        photos={(photos || []).map((p, idx) => ({
          url: p.file ? URL.createObjectURL(p.file) : p.url,
          alt: `Photo ${idx + 1}`,
          selected: idx === selectedIndex,
          onClick: () => setSelectedIndex(idx),
        }))}
      />

      <Row gap="0.5rem" width='100%' padding="0.5rem 20% 0 20%">
        <Button fullWidth variant='primary' onClick={onUploadPhoto}>Upload Photo</Button>
        <Button fullWidth variant="danger" onClick={handleDelete} disabled={selectedIndex === null}>Delete Selected</Button>
      </Row>
    </div>
  );
};

export default PhotosList; 