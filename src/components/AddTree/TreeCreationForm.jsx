import React, { useState, useMemo, useEffect } from 'react';
import { TextInput, TextArea } from '../Input';
import SelectDropdown from '../SelectDropdown';
import DateInput from '../DateInput';
import Checkbox from '../Checkbox';
import FileUpload from '../FileUpload';
import AudioUploadCard from '../AudioUploadCard';
import Row from '../../layout/containers/Row';
import Button from '../Button';
import { TreePine, User, Shield, Globe, Settings } from 'lucide-react';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Column from '../../layout/containers/Column';
import ToggleSwitch from '../ToggleSwitch';
import countryList from "react-select-country-list";
import Grid from '../../layout/containers/Grid';
import Loading from '../Loading';

const TreeCreationForm = ({ onSubmit, onCancel, interfaceLanguage = 'en', isEdit = false, treeToEdit = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    // Tree Information
    familyName: '',
    familyDescription: '',
    origineTribe: '',
    origineTongue: '',
    origineHomeLand: '',
    familyPhoto: null,
    marriageTypeAllowed: '',

    // Root Person Information
    rootPersonName: '',
    rootPersonGender: '',
    rootPersonDob: '',
    rootPersonPlaceOfBirth: '',
    rootPersonPhoto: null,
    rootPersonBiography: '',
    rootPersonTribe: '',
    rootPersonStoryTitle: '',
    rootPersonAudioFile: null,
    rootPersonAudioURL: null,

    // Language
    language: interfaceLanguage,

    // Role Assignment
    globalMatchOptIn: false,
    allowMergeRequests: false,
    isPublic: false,
    invitesEnabled: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && treeToEdit) {
      setFormData({
        familyName: treeToEdit.familyName || '',
        familyDescription: treeToEdit.familyDescription || '',
        origineTribe: treeToEdit.origineTribe || '',
        origineTongue: treeToEdit.origineTongue || '',
        origineHomeLand: treeToEdit.origineHomeLand || '',
        familyPhoto: treeToEdit.familyPhoto || null,
        marriageTypeAllowed: treeToEdit.marriageTypeAllowed || '',
        rootPersonName: '',
        rootPersonGender: '',
        rootPersonDob: '',
        rootPersonPlaceOfBirth: '',
        rootPersonPhoto: null,
        rootPersonBiography: '',
        rootPersonTribe: '',
        rootPersonStoryTitle: '',
        rootPersonAudioFile: null,
        rootPersonAudioURL: null,
        language: treeToEdit.language || interfaceLanguage,
        globalMatchOptIn: treeToEdit.globalMatchOptIn || false,
        allowMergeRequests: treeToEdit.allowMergeRequests || false,
        isPublic: treeToEdit.isPublic || false,
        invitesEnabled: treeToEdit.invitesEnabled !== undefined ? treeToEdit.invitesEnabled : true,
      });
    } else {
      setFormData({
        // Tree Information
        familyName: '',
        familyDescription: '',
        origineTribe: '',
        origineTongue: '',
        origineHomeLand: '',
        familyPhoto: null,
        marriageTypeAllowed: '',

        // Root Person Information
        rootPersonName: '',
        rootPersonGender: '',
        rootPersonDob: '',
        rootPersonPlaceOfBirth: '',
        rootPersonPhoto: null,
        rootPersonBiography: '',
        rootPersonTribe: '',
        rootPersonStoryTitle: '',
        rootPersonAudioFile: null,
        rootPersonAudioURL: null,

        // Language
        language: interfaceLanguage,

        // Role Assignment
        globalMatchOptIn: false,
        allowMergeRequests: false,
        isPublic: false,
        invitesEnabled: true,
      });
    }
  }, [isEdit, treeToEdit, interfaceLanguage]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.familyName.trim()) {
      newErrors.familyName = 'Tree name is required';
    }
    if (!isEdit) {
      if (!formData.rootPersonName.trim()) {
        newErrors.rootPersonName = 'Root person name is required';
      }
      if (!formData.rootPersonGender) {
        newErrors.rootPersonGender = 'Root person gender is required';
      }
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



  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'ar', label: 'Arabic' },

  ];

  const countryOptions = useMemo(() => countryList().getData(), []);

  return (
    <div style={{ position: 'relative' }}>
      {isSubmitting && (
        <Loading
          variant="overlay"
          lottieName="treeCreationLoader"
          message="Creating your family tree..."
        />
      )}
      <form onSubmit={handleSubmit} className="form">

        {/* Section 1: Tree Information */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <TreePine size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Tree Information</Text>
          </Column>
        </div>

        {/* Basic Information */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Tree Name *</label>
          <TextInput
            value={formData.familyName}
            onChange={(e) => handleInputChange('familyName', e.target.value)}
            required
            placeholder="Enter family tree name"
          />
          {errors.familyName && <span className="error-message">{errors.familyName}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Family Description</label>
          <TextArea
            value={formData.familyDescription}
            onChange={(e) => handleInputChange('familyDescription', e.target.value)}
            placeholder="Describe your family history..."
            rows={3}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Family Photo</label>
          <FileUpload
            onChange={(file) => handleInputChange('familyPhoto', file)}
            accept="image/*"
          />
        </div>

        {/* Cultural Information - First Row */}
        <div style={{ marginBottom: '1rem' }}>

          <Row gap="1rem" padding='0px' margin='0px' justifyContent="start">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Origine Tribe</label>
              <TextInput
                value={formData.origineTribe}
                onChange={(e) => handleInputChange('origineTribe', e.target.value)}
                placeholder="Enter tribe or ethnic group"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Origine Tongue</label>
              <TextInput
                value={formData.origineTongue}
                onChange={(e) => handleInputChange('origineTongue', e.target.value)}
                placeholder="Enter native language"
              />
            </div>
          </Row>
        </div>

        {/* Geographic & Marriage Information - Second Row */}
        <div style={{ marginBottom: '1rem' }}>

          <Row gap="1rem" padding='0px' margin='0px' justifyContent="start">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Origine Homeland</label>
              <SelectDropdown
                value={formData.origineHomeLand}
                onChange={(e) => handleInputChange('origineHomeLand', e.target.value)}
                options={countryOptions}
                placeholder="Select country of origin"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Marriage Type Allowed</label>
              <SelectDropdown
                value={formData.marriageTypeAllowed}
                onChange={(e) => handleInputChange('marriageTypeAllowed', e.target.value)}
                options={[
                  { value: 'monogamous', label: 'Monogamous' },
                  { value: 'polygamous', label: 'Polygamous' },
                  { value: 'both', label: 'Both' }
                ]}
                placeholder="Select marriage type"
              />
            </div>
          </Row>
        </div>

      </div>

      {/* Section 2: Root Person Information */}
      {!isEdit && (
        <div className="section-card">
          <div className="section-header">
            <Card fitContent margin='0.5rem' className="section-icon">
              <User size={20} />
            </Card>
            <Column padding='0px' margin='0px' gap='1px'>
              <Text as='p' variant='heading2'>Root Person Information</Text>
              <Text as='p' variant='caption1'>This person will be the starting point of your family tree</Text>
            </Column>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <TextInput
                value={formData.rootPersonName}
                onChange={(e) => handleInputChange('rootPersonName', e.target.value)}
                required
                placeholder="Enter full name"
              />
              {errors.rootPersonName && <span className="error-message">{errors.rootPersonName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <SelectDropdown
                value={formData.rootPersonGender}
                onChange={(e) => handleInputChange('rootPersonGender', e.target.value)}
                options={genderOptions}
                required
                placeholder="Select gender"
              />
              {errors.rootPersonGender && <span className="error-message">{errors.rootPersonGender}</span>}
            </div>

            <div className="form-group">
              <Row gap="0.5rem" padding='0px' margin='0px' justifyContent="start">
                <Column gap='0.10rem' padding='0px' margin='0px'>
                  <label className="form-label">Date of Birth</label>
                  <DateInput
                    value={formData.rootPersonDob}
                    onChange={(e) => handleInputChange('rootPersonDob', e.target.value)}
                    placeholder="Select date of birth"
                  />
                </Column>
                <Column gap='0.10rem' padding='0px' margin='0px'>
                  <label className="form-label">Place of Birth</label>
                  <TextInput
                    value={formData.rootPersonPlaceOfBirth}
                    onChange={(e) => handleInputChange('rootPersonPlaceOfBirth', e.target.value)}
                    placeholder="Enter place of birth"
                  />
                </Column>
              </Row>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo</label>
              <FileUpload
                onChange={(file) => handleInputChange('rootPersonPhoto', file)}
                accept="image/*"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Biography</label>
              <TextArea
                value={formData.rootPersonBiography}
                onChange={(e) => handleInputChange('rootPersonBiography', e.target.value)}
                placeholder="Share their life story..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Story Title</label>
              <TextInput
                value={formData.rootPersonStoryTitle}
                onChange={(e) => handleInputChange('rootPersonStoryTitle', e.target.value)}
                placeholder="Enter story title"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Upload Audio Story</label>
              <AudioUploadCard
                onAudioUpload={(file, audioURL) => {
                  handleInputChange('rootPersonAudioFile', file);
                  handleInputChange('rootPersonAudioURL', audioURL);
                }}
                storyTitle={formData.rootPersonStoryTitle}
              />
            </div>
          </div>
        </div>
      )}



      {/* Section 3: Language Defaults */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <Globe size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Language Defaults</Text>
          </Column>
        </div>

        <div className="form-group">
          <label className="form-label">Interface Language</label>
          <SelectDropdown
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            options={languageOptions}
          />
        </div>
      </div>


      {/* Section 4: Privacy & Visibility */}
      <div className="section-card">
        <div className="section-header">
          <Card fitContent margin='0.5rem' className="section-icon">
            <Shield size={20} />
          </Card>
          <Column padding='0px' margin='0px' gap='1px'>
            <Text as='p' variant='heading2'>Privacy & Visibility</Text>
          </Column>
        </div>

        <Grid columns={2}>

          <div className="form-group">
            <label className="form-label">Tree public</label>
            <ToggleSwitch
              checked={formData.isPublic}
              onChange={(checked) => handleInputChange('isPublic', checked)}
              label={formData.isPublic ? "Public" : "Private"}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Allow Invites</label>
            <ToggleSwitch
              checked={formData.invitesEnabled}
              onChange={(checked) => handleInputChange('invitesEnabled', checked)}
              label={formData.invitesEnabled ? "Enabled" : "Disabled"}
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <Checkbox
                checked={formData.globalMatchOptIn}
                onChange={(e) => handleInputChange('globalMatchOptIn', e.target.checked)}
                label="Global Match Opt-In"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <Checkbox
                checked={formData.allowMergeRequests}
                onChange={(e) => handleInputChange('allowMergeRequests', e.target.checked)}
                label="Allow Merge Requests"
              />
            </label>
          </div>

        </Grid>

      </div>



      <Row className="button-group">
        <Button fullWidth variant='danger' onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button fullWidth type="submit" disabled={isSubmitting}>
          {isEdit ? 'Update Tree' : 'Create Tree'}
        </Button>
      </Row>
    </form>
    </div>
  );
};

export default TreeCreationForm;
