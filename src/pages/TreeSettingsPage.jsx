import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Text from '../components/Text';
import Button from '../components/Button';
import ToggleSwitch from '../components/ToggleSwitch';
import SelectDropdown from '../components/SelectDropdown';
import { TextInput } from '../components/Input';
import Checkbox from '../components/Checkbox';
import FileUpload from '../components/FileUpload';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import { useTreeSettings } from '../hooks/useTreeSettings';
import { Tooltip } from '../components/Tooltip';
import { personServiceFirebase } from '../services/data/personServiceFirebase';
import dataService from '../services/dataService';

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

const sizeOptions = [
  { value: '<1MB', label: '<1MB' },
  { value: '1-5MB', label: '1-5MB' },
  { value: '5-10MB', label: '5-10MB' },
  { value: '10-50MB', label: '10-50MB' },
  { value: '50-100MB', label: '50-100MB' },
  { value: '100-500MB', label: '100-500MB' },
  { value: '>500MB', label: '>500MB' },
];

const TreeSettingsPage = () => {
  const { treeId } = useParams();
  const {
    tree,
    updateSetting,
    saveSettings,
    resetSettings,
    saveStatus,
  } = useTreeSettings(treeId);

  const [rootName, setRootName] = useState('Loading...');
  const [creatorName, setCreatorName] = useState('Loading...');
  const [firstRootName, setFirstRootName] = useState('Loading...');

  useEffect(() => {
    if (tree.currentRootId) {
      personServiceFirebase.getPerson(tree.currentRootId).then(person => {
        setRootName(person ? person.name : 'Unknown');
      }).catch(() => setRootName('Unknown'));
    } else {
      setRootName('None');
    }
  }, [tree.currentRootId]);

  useEffect(() => {
    if (tree.currentRootId) {
      personServiceFirebase.getPerson(tree.currentRootId).then(person => {
        setRootName(person ? person.name : 'Unknown');
        setFirstRootName(person ? person.name : 'Unknown');
      }).catch(() => {
        setRootName('Unknown');
        setFirstRootName('Unknown');
      });
    } else {
      setRootName('None');
      setFirstRootName('None');
    }
  }, [tree.currentRootId]);

  useEffect(() => {
    if (tree.createdBy) {
      personServiceFirebase.getPerson(tree.createdBy).then(person => {
        setCreatorName(person ? person.name : 'Unknown');
      }).catch(() => setCreatorName('Unknown'));
    } else {
      setCreatorName('Unknown');
    }
  }, [tree.createdBy]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString();
  };

  const handleDeleteTree = () => {
    if (window.confirm('Are you sure you want to delete this tree?')) {
      alert('Tree deleted (not implemented)');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <Text variant="heading1" style={{ marginBottom: '1.5rem', color: '#2c3e50', fontWeight: '700', fontSize: '2.5rem', textAlign: 'center' }}>
        Tree Settings
      </Text>

      {/* Basic Information - Full Width */}
      <Section title="Basic Information" collapsible style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <EditableTextArea
              label="Family Name"
              value={tree.familyName}
              onSave={(value) => updateSetting('familyName', value)}
              placeholder="Enter family name"
            />
            <EditableTextArea
              label="Family Description"
              value={tree.familyDescription}
              onSave={(value) => updateSetting('familyDescription', value)}
              placeholder="Enter family description"
            />
            <EditableTextArea
              label="Origin Tribe"
              value={tree.orgineTribe}
              onSave={(value) => updateSetting('orgineTribe', value)}
              placeholder="Enter origin tribe"
            />
          </div>
          <div>
            <EditableTextArea
              label="Origin Tongue"
              value={tree.origineTongue}
              onSave={(value) => updateSetting('origineTongue', value)}
              placeholder="Enter origin tongue"
            />
            <EditableTextArea
              label="Origin Homeland"
              value={tree.origineHomeLand}
              onSave={(value) => updateSetting('origineHomeLand', value)}
              placeholder="Enter origin homeland"
            />
            <Row style={{ marginTop: '0.5rem' }}>
              <FileUpload
                label="Upload Family Photo"
                accept="image/*"
                initialPreview={tree.familyPhoto}
                onChange={async (file) => {
                  try {
                    // Upload the file using dataService.uploadMedia since it's media
                    const uploadResult = await dataService.uploadMedia(file, treeId, null, 'current-user', {
                      role: 'family-photo',
                      title: 'Family Photo',
                      visibility: 'public'
                    });
                    // Save the URL to tree settings
                    updateSetting('familyPhoto', uploadResult.url);
                  } catch (error) {
                    console.error('Failed to upload family photo:', error);
                    alert('Failed to upload image. Please try again.');
                  }
                }}
              />
            </Row>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <Text style={{ fontWeight: '600', color: '#7f8c8d' }}>Current Root Person: {rootName}</Text>
          <Text style={{ fontWeight: '600', color: '#7f8c8d' }}>Created By: {creatorName}</Text>
          <Text style={{ fontWeight: '600', color: '#7f8c8d' }}>Created At: {formatDate(tree.createdAt)}</Text>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <Text style={{ fontWeight: '600', color: '#7f8c8d' }}>Updated At: {formatDate(tree.updatedAt)}</Text>
          <Text style={{ fontWeight: '600', color: '#7f8c8d' }}>Tree ID: {treeId}</Text>
        </div>
      </Section>

      {/* Settings Layout with varied sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Privacy & Access */}
        <Section title="Privacy & Access" collapsible style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <Setting label="Public Tree" tooltip="Make this tree visible to everyone" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.privacy.isPublic}
                onChange={(v) => updateSetting('settings.privacy.isPublic', v)}
              />
            </Setting>
            <Setting label="Allow Merge Requests" tooltip="Allow others to suggest changes" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.privacy.allowMergeRequests}
                onChange={(v) => updateSetting('settings.privacy.allowMergeRequests', v)}
              />
            </Setting>
            <Setting label="Allow Global Match" tooltip="Opt-in to global matching with other trees" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.privacy.globalMatchOptIn}
                onChange={(v) => updateSetting('settings.privacy.globalMatchOptIn', v)}
              />
            </Setting>
            <Setting label="Allow Invites" tooltip="Allow inviting new members" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.privacy.allowInvites}
                onChange={(v) => updateSetting('settings.privacy.allowInvites', v)}
              />
            </Setting>
          </Row>
        </Section>

        {/* Relationship Rules */}
        <Section title="Relationship Rules" collapsible style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <Setting label="Allow Polygamy" tooltip="Allow multiple spouses for one person" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.relationship.allowPolygamy}
                onChange={(v) => updateSetting('settings.relationship.allowPolygamy', v)}
              />
            </Setting>
            <Setting label="Allow Multiple Marriages" tooltip="Allow multiple marriages over time" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.relationship.allowMultipleMarriages}
                onChange={(v) => updateSetting('settings.relationship.allowMultipleMarriages', v)}
              />
            </Setting>
            <Setting label="Allow Unknown Parent Linking" tooltip="Allow linking to unknown parents" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.relationship.allowUnknownParentLinking}
                onChange={(v) => updateSetting('settings.relationship.allowUnknownParentLinking', v)}
              />
            </Setting>
          </Row>
        </Section>

        {/* Display Preferences */}
        <Section title="Display Preferences" collapsible style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <Setting label="Show Role Badges" tooltip="Display role badges on persons" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.display.showRoleBadges}
                onChange={(v) => updateSetting('settings.display.showRoleBadges', v)}
              />
            </Setting>
            <Setting label="Show Gender Icons" tooltip="Display gender icons on persons" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.display.showGenderIcons}
                onChange={(v) => updateSetting('settings.display.showGenderIcons', v)}
              />
            </Setting>
            <Text style={{ fontWeight: '600', color: '#7f8c8d', flex: '1 1 100%' }}>
              Default Root Person: {firstRootName || 'None'}
            </Text>
          </Row>
        </Section>

        {/* Language Options */}
        <Section title="Language Options" collapsible style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <SelectDropdown
              label="Interface Language"
              options={languages.map(lang => ({ value: lang.code, label: `${lang.label} (${lang.native})` }))}
              value={tree.settings.language.interfaceLanguage}
              onChange={(value) => updateSetting('settings.language.interfaceLanguage', value)}
              style={{ flex: '1 1 300px' }}
            />
            <Setting label="Allow Per-User Language Override" tooltip="Allow users to override interface language" style={{ flex: '1 1 200px' }}>
              <ToggleSwitch
                checked={tree.settings.language.allowPerUserLanguageOverride}
                onChange={(v) => updateSetting('settings.language.allowPerUserLanguageOverride', v)}
              />
            </Setting>
          </Row>
        </Section>
        {/* Fix tooltip overflow by adding zIndex to container */}
        <style>
          {`
            .tooltip-container {
              position: relative;
              z-index: 2000;
            }
          `}
        </style>

        {/* Life Event Toggles */}
        <Section title="Life Event Toggles" collapsible style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem' }}>
            {Object.entries(tree.settings.lifeEvents).map(([key, val]) => (
              <Tooltip key={key} content={`Toggle visibility of ${key} events`}>
                <Checkbox
                  name={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  checked={val}
                  onChange={(e) => updateSetting(`settings.lifeEvents.${key}`, e.target.checked)}
                  style={{ flex: '1 1 150px' }}
                />
              </Tooltip>
            ))}
          </Row>
        </Section>

        {/* Content Limits */}
        <Section title="Content Limits" collapsible style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <Tooltip content="Maximum length of stories (characters)" style={{ flex: '1 1 200px' }}>
              <TextInput
                label="Max Story Length (characters)"
                type="number"
                value={tree.settings.limits.maxStoryLength}
                onChange={(e) => updateSetting('settings.limits.maxStoryLength', parseInt(e.target.value))}
              />
            </Tooltip>
            <Tooltip content="Maximum image file size allowed" style={{ flex: '1 1 200px' }}>
              <SelectDropdown
                label="Max Image File Size (MB)"
                options={sizeOptions}
                value={tree.settings.limits.maxImageFileSize}
                onChange={(value) => updateSetting('settings.limits.maxImageFileSize', value)}
              />
            </Tooltip>
            <Tooltip content="Maximum audio file size allowed" style={{ flex: '1 1 200px' }}>
              <SelectDropdown
                label="Max Audio File Size (MB)"
                options={sizeOptions}
                value={tree.settings.limits.maxAudioFileSize}
                onChange={(value) => updateSetting('settings.limits.maxAudioFileSize', value)}
              />
            </Tooltip>
          </Row>
        </Section>

        {/* Admin Controls */}
        <Section title="Admin Controls" collapsible style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px' }}>
          <Row style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <Button onClick={() => alert('Export Tree')}>Export Tree</Button>
            <Button onClick={resetSettings}>Reset Defaults</Button>
            <Button
              onClick={handleDeleteTree}
              style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}
            >
              Delete Tree
            </Button>
          </Row>
        </Section>
      </div>

      {/* Save Button */}
      <Row style={{ alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <Button
          onClick={saveSettings}
          disabled={saveStatus === 'saving'}
          style={{
            backgroundColor: saveStatus === 'saving' ? '#95a5a6' : saveStatus === 'unsaved' ? '#e67e22' : '#2980b9',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(41, 128, 185, 0.4)',
            transition: 'background-color 0.3s ease',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Save Changes' : 'Save All Changes'}
        </Button>
        {saveStatus === 'saved' && (
          <Text style={{ color: '#27ae60', fontWeight: '600' }}>Saved!</Text>
        )}
        {saveStatus === 'error' && (
          <Text style={{ color: '#c0392b', fontWeight: '600' }}>
            Error saving settings
          </Text>
        )}
      </Row>
    </div>
  );
};

export default TreeSettingsPage;

/* Helper UI subcomponents */
const Section = ({ title, children, collapsible, ...props }) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <section
      style={{
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        ...props.style,
      }}
    >
      <Text
        variant="heading3"
        style={{
          marginBottom: '0.5rem',
          cursor: collapsible ? 'pointer' : 'default',
        }}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        {collapsible && (collapsed ? '▶ ' : '▼ ')}{title}
      </Text>
      {!collapsed && <Column style={{ gap: '0.5rem' }}>{children}</Column>}
    </section>
  );
};

const Setting = ({ label, tooltip, children }) => (
  <Row
    style={{
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '0.5rem',
    }}
  >
    {tooltip ? (
      <Tooltip content={tooltip}>
        <Text>{label}</Text>
      </Tooltip>
    ) : (
      <Text>{label}</Text>
    )}
    {children}
  </Row>
);

const EditableTextArea = ({ label, value, onSave, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleEdit = () => {
    setEditing(true);
    setTempValue(value);
  };

  const handleApply = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setEditing(false);
  };

  const handleReset = () => {
    setTempValue(value);
    setEditing(false);
  };

  return (
    <Column style={{ marginTop: '0.5rem' }}>
      <Text style={{ marginBottom: '0.25rem', fontWeight: 'bold', color: '#7f8c8d' }}>{label}</Text>
      <Row style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
        <textarea
          value={editing ? tempValue : value}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleApply}
          placeholder={placeholder}
          readOnly={!editing}
          style={{
            flex: 1,
            minHeight: '60px',
            padding: '0.5rem',
            border: editing ? '1px solid #ccc' : '1px solid transparent',
            borderRadius: '4px',
            backgroundColor: editing ? '#fff' : '#f9f9f9',
            resize: 'vertical',
          }}
        />
        {editing ? (
          <Tooltip content="Reset changes">
            <Button onClick={handleReset} style={{ padding: '0.5rem', minWidth: 'auto' }}>
              ↶
            </Button>
          </Tooltip>
        ) : (
          <Tooltip content="Edit">
            <Button onClick={handleEdit} style={{ padding: '0.5rem', minWidth: 'auto' }}>
              ✏️
            </Button>
          </Tooltip>
        )}
      </Row>
    </Column>
  );
};
