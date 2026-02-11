// components/Audio/RecordModal.jsx
import React, { useState } from 'react';
import Modal from '../../../layout/containers/Modal.jsx';
import { TextInput, TextArea } from '../../Input.jsx';
import RecordingControls from './RecordingControl.jsx';
import RecordingTimer from './RecordingTimer.jsx';
import RecordingPreview from './RecordingPreview.jsx';
import useAudioRecorder from '../../../hooks/useAudioRecorder.js';
import Text from '../../Text.jsx';
import Card from '../../../layout/containers/Card.jsx';
import Row from '../../../layout/containers/Row.jsx';
import { createAudioStory } from '../../../controllers/tree/stories.js';
import { validateAudioFile } from '../../../utils/featuresUtils/audioValidator.js';
import Column from '../../../layout/containers/Column.jsx';

const RecordModal = ({ isOpen, onClose, personId, treeId, addedBy }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [tags, setTags] = useState(''); // comma-separated input, saved as array
  const [resetKey, setResetKey] = useState(Date.now());
  const [validationError, setValidationError] = useState(null);
  const [recordingSize, setRecordingSize] = useState(null);

  const {
    status,
    audioURL,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStart = () => {
    if (status === 'paused') resumeRecording();
    else startRecording();
  };

  const handleClose = () => {
    resetRecording();
    setTitle('');
    setSubtitle('');
    setLanguage('en');
    setTags('');
    setResetKey(Date.now());
    setValidationError(null);
    setRecordingSize(null);
    onClose();
  };

  const handleUpload = async () => {
    try {
      if (!audioURL) {
        setValidationError('No recording to upload');
        return;
      }
      const blob = await fetch(audioURL).then(res => res.blob());

      const validation = validateAudioFile(blob, { maxSizeMB: 5 });
      if (!validation.valid) {
        setValidationError(validation.error);
        return;
      } else {
        setValidationError(null);
      }

      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await createAudioStory({
        treeId,
        personId,
        addedBy,
        storyTitle: title,
        language: language || 'en',
        audioFile: blob,
        subtitle: subtitle || null,
        tags: parsedTags.length ? parsedTags : undefined,
      });

      handleClose();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleStoppedComputeSize = async () => {
    try {
      if (!audioURL) return;
      const blob = await fetch(audioURL).then(r => r.blob());
      setRecordingSize(blob.size);
    } catch { }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>

      <Card fitContent padding='5px' margin='20px 0px' backgroundColor="var(--color-transparent)" position='left'>
        <Text variant='heading2'>New Recordings</Text>
      </Card>
    <Row>
    
      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter recording title"
      />

      <TextInput
        label="Subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Enter recording subtitle"
      />
      </Row>

      <Row>

        <TextInput
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="e.g., en, fr, es"
        />

        <TextInput
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated (e.g., family, memory)"
        />

      </Row>


      <div className="recording-section">
        <RecordingTimer
          isPaused={status === 'paused' || status === 'idle'}
          isStopped={status === 'stopped'}
          resetKey={resetKey}
        />

        <RecordingControls
          onStart={handleStart}
          onPause={pauseRecording}
          onStop={() => { stopRecording(); setTimeout(handleStoppedComputeSize, 0); }}
          onRestart={() => {
            resetRecording();
            setResetKey(Date.now());
            setTitle('');
            setSubtitle('');
            setLanguage('en');
            setTags('');
            setRecordingSize(null);
          }}
          onUpload={handleUpload}
          status={status}
        />

        {audioURL && <RecordingPreview audioUrl={audioURL} />}
      </div>

      {recordingSize !== null && (
        <div style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <small>Recording size: {(recordingSize / (1024 * 1024)).toFixed(2)} MB</small>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</div>
      )}

      {validationError && (
        <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{validationError}</div>
      )}
    </Modal>
  );
};

export default RecordModal;
