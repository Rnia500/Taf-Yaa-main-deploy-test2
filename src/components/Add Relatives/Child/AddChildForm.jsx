import React, { useState, useEffect, useMemo } from 'react';
import { TextInput, TextArea } from '../../Input';
import SelectDropdown from '../../SelectDropdown';
import DateInput from '../../DateInput';
import Checkbox from '../../Checkbox';
import FileUpload from '../../FileUpload';
import AudioUploadCard from '../../AudioUploadCard';
import EventCard from '../../EventCard';
import Row from '../../../layout/containers/Row';
import Button from '../../Button';
import { User, BookOpen, Shield, Calendar, Plus } from 'lucide-react';
import Card from '../../../layout/containers/Card';
import Text from '../../Text';
import Column from '../../../layout/containers/Column';
import countryList from "react-select-country-list";
import AddAttachmentModal from '../../modals/AddAttachmentModal';
import { ImageAttachmentCard, VideoAttachmentCard, AudioAttachmentCard, FileAttachmentCard } from '../../AttachmentCard';

const AddChildForm = ({ onSubmit, onCancel, parent1Name, parent2Name, wives = [], defaultMotherId }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    isDeceased: false,
    phoneNumber: '',
    email: '',
    dateOfDeath: '',
    placeOfBirth: '',
    placeOfDeath: '',
    nationality: '',
    countryOfResidence: '',
    profilePhoto: null,
    biography: '',
    tribe: '',
    language: '',
    // Story fields
    title: '',
    description: '',
    location: '',
    time: '',
    tags: '',
    attachments: [],
    privacyLevel: 'membersOnly',
    allowGlobalMatching: true,
    motherId: defaultMotherId || '',
    events: []
  });

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  useEffect(() => {
    if (defaultMotherId) {
      setFormData(prev => ({
        ...prev,
        motherId: defaultMotherId
      }));
    }
  }, [defaultMotherId]);

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (typeof window !== 'undefined') window.__ADD_CHILD_FORM_LAST_UPDATE__ = { field, value };
  };

  const handleEventsChange = (newEventsArray) => {
    setFormData(prev => ({
      ...prev,
      events: newEventsArray
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  const privacyOptions = [
    { value: 'private', label: 'Only Me (Highest Privacy)' },
    { value: 'membersOnly', label: 'Family Members Only' },
    { value: 'authenticated', label: 'Registered Users' },
    { value: 'public', label: 'Public (Lowest Privacy)' }
  ];

  const countryOptions = useMemo(() => countryList().getData(), []);

  return (
    <form onSubmit={handleSubmit} className="form">

      {/* Display the parents' names at the top of the form */}
      <Card margin='0px 0px 20px 0px' >
        {wives.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px', zIndex: "9999999" }}>
            <Text variant='heading3'>Child of {parent1Name} and</Text>
            <SelectDropdown
              value={formData.motherId}
              placeholder={'Select a wife please'}
              onChange={(e) => setFormData(prev => ({ ...prev, motherId: e.target.value }))}
              options={[
                ...wives.map(w => ({ value: w.id, label: w.name }))
              ]}
            />
          </div>
        ) : (
          <Text as='p' variant='heading3' style={{ margin: 0, color: '#495057', fontSize: '18px', fontWeight: 600 }}>
            Child of {parent1Name} and {parent2Name}
          </Text>
        )}
      </Card>

      {/* Section 1: Personal Information */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <User size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Personal Information</Text>
          </Column>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <TextInput
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              placeholder="Enter full name"
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Gender *</label>
            <SelectDropdown
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              options={genderOptions}
              required
              placeholder="Select gender"
            />
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>

          <div className="form-group">

            <Row gap="0.5rem" padding='0px' margin='0px' justifyContent="start">
              <Column gap='0.10rem' padding='0px' margin='0px'>
                <label className="form-label">Date of Birth</label>
                <DateInput
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  placeholder="Select date of birth"
                />
              </Column>
              <Column gap='0.10rem' padding='0px' margin='0px'>
                <label className="form-label">Place of Birth</label>
                <TextInput
                  value={formData.placeOfBirth}
                  onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                  placeholder="Enter place of birth"
                />
              </Column>
            </Row>

          </div>

          <div className="form-group">

            <Row gap="0.5rem" padding='0px' margin='0px' justifyContent="start">
              <Column gap='0.10rem' padding='0px' margin='0px'>
                <label className="form-label">Phone Number</label>
                <TextInput
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                />
              </Column>
              <Column gap='0.10rem' padding='0px' margin='0px'>
                <label className="form-label">Email</label>
                <TextInput
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </Column>
            </Row>

          </div>

          <div className="form-group">

            <Column gap='0.10rem' padding='2px' margin='0px'>
              <label className="form-label">Nationalty</label>
              <SelectDropdown
                options={countryOptions}
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="Enter Nationality"
              />
            </Column>
          </div>
          <div className="form-group">
            <Column gap='0.10rem' padding='2px' margin='0px'>
              <label className="form-label">Country of Residence</label>
              <SelectDropdown
                options={countryOptions}
                value={formData.countryOfResidence}
                onChange={(e) => handleInputChange('countryOfResidence', e.target.value)}
                placeholder="Enter The Country of Residence"
              />
            </Column>

          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <Checkbox
                checked={formData.isDeceased}
                onChange={(e) => handleInputChange('isDeceased', e.target.checked)}
                label="Is Deceased?"
              />
            </label>
          </div>

          {formData.isDeceased && (

            <>
              <div className="form-group">
                <label className="form-label">Date of Death</label>
                <DateInput
                  value={formData.dateOfDeath}
                  onChange={(e) => handleInputChange('dateOfDeath', e.target.value)}
                  placeholder="Select date of death"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Place of Death</label>
                <TextInput
                  value={formData.placeOfDeath}
                  onChange={(e) => handleInputChange('placeOfDeath', e.target.value)}
                  placeholder="Select Place of death"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <FileUpload
              onChange={(file) => handleInputChange('profilePhoto', file)}
              accept="image/*"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Biography</label>
            <TextArea
              value={formData.biography}
              onChange={(e) => handleInputChange('biography', e.target.value)}
              placeholder="Share their life story..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tribe/Clan</label>
            <TextInput
              value={formData.tribe}
              onChange={(e) => handleInputChange('tribe', e.target.value)}
              placeholder="Enter tribe or clan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Language</label>
            <TextInput
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              placeholder="Primary language"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Story */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <BookOpen size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Story</Text>
          </Column>
        </div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <TextInput
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter story title"
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Description</label>
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Tell the story..."
            rows={3}
          />
        </div>

        <Row gap='1rem' padding='0px' margin='0px'>
          <div className="form-group">
            <label className="form-label">Location</label>
            <TextInput
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <TextInput
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              placeholder="e.g., 1995, Summer 2020"
            />
          </div>
        </Row>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <TextInput
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="Comma-separated (e.g., family, childhood, celebration)"
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Attachments</label>
          <Row gap="0.5rem" padding="0px" margin="0px" wrap="wrap">
            {formData.attachments.map((attachment, index) => {
              const renderAttachmentCard = () => {
                switch (attachment.type) {
                  case 'image':
                    return (
                      <ImageAttachmentCard
                        key={index}
                        src={attachment.url}
                        alt={attachment.caption}
                        caption={attachment.caption}
                        uploader={attachment.uploadedBy}
                        onDelete={() => {
                          const newAttachments = formData.attachments.filter((_, i) => i !== index);
                          handleInputChange('attachments', newAttachments);
                        }}
                        attachmentId={attachment.attachmentId}
                      />
                    );
                  case 'video':
                    return (
                      <VideoAttachmentCard
                        key={index}
                        src={attachment.url}
                        alt={attachment.caption}
                        caption={attachment.caption}
                        uploader={attachment.uploadedBy}
                        duration={attachment.duration}
                        onDelete={() => {
                          const newAttachments = formData.attachments.filter((_, i) => i !== index);
                          handleInputChange('attachments', newAttachments);
                        }}
                        attachmentId={attachment.attachmentId}
                      />
                    );
                  case 'audio':
                    return (
                      <AudioAttachmentCard
                        key={index}
                        thumbnail={attachment.thumbnail}
                        duration={attachment.duration}
                        title={attachment.caption}
                        uploader={attachment.uploadedBy}
                        onDelete={() => {
                          const newAttachments = formData.attachments.filter((_, i) => i !== index);
                          handleInputChange('attachments', newAttachments);
                        }}
                        attachmentId={attachment.attachmentId}
                      />
                    );
                  case 'pdf':
                  case 'file':
                    return (
                      <FileAttachmentCard
                        key={index}
                        fileUrl={attachment.url}
                        fileName={attachment.caption}
                        onDelete={() => {
                          const newAttachments = formData.attachments.filter((_, i) => i !== index);
                          handleInputChange('attachments', newAttachments);
                        }}
                        attachmentId={attachment.attachmentId}
                      />
                    );
                  default:
                    return null;
                }
              };
              return renderAttachmentCard();
            })}
            <Card
              onClick={() => setIsAttachmentModalOpen(true)}
              style={{
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px dashed #ccc',
                borderRadius: '12px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Plus size={24} color="#666" />
            </Card>
          </Row>
        </div>
      </div>

      {/* Section 3: Events */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <Calendar size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Events</Text>
          </Column>
        </div>

        <EventCard
          events={formData.events}
          onEventsChange={handleEventsChange}
        />
      </div>

      {/* Section 4: Privacy */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <Shield size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Privacy Settings</Text>
          </Column>
        </div>

        <div className="form-group">
          <label className="form-label">Profile Visibility</label>
          <SelectDropdown
            value={formData.privacyLevel}
            onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
            options={privacyOptions}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <Checkbox
            checked={formData.allowGlobalMatching}
            onChange={(e) => handleInputChange('allowGlobalMatching', e.target.checked)}
            label="Allow Global Matching"
          />
        </label>
      </div>

      <Row className="button-group">
        <Button fullWidth variant='danger' onClick={onCancel}>
          Cancel
        </Button>
        <Button fullWidth type="submit">
          Add Child
        </Button>
      </Row>

      {/* Add Attachment Modal */}
      <AddAttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onAttachmentAdded={(attachment) => {
          handleInputChange('attachments', [...formData.attachments, attachment]);
          setIsAttachmentModalOpen(false);
        }}
      />
    </form>
  );
};

export default AddChildForm;
