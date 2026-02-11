import React, { useState, useContext } from 'react';
import FileUpload from './FileUpload';
import Card from '../layout/containers/Card';
import Text from './Text';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import WaveformPlayer from './WaveformPlayer';
import AudioPlayer from './AudioPLayer';
import { CheckCircle, X } from 'lucide-react';
import '../styles/AudioUploadCard.css';

import dataService from '../services/dataService';
import { validateAudioFile } from '../utils/featuresUtils/audioValidator.js';
import { TreeContext } from '../context/TreeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function AudioUploadCard({ onAudioUpload, storyTitle }) {
  // Handle case where AudioUploadCard is used outside TreeProvider (like in tree creation modal)
  const context = useContext(TreeContext);
  let treeId;
  if (context) {
    treeId = context.treeId;
  } else {
    treeId = 'creating';
  }
  const { currentUser } = useAuth();

  const [audioFile, setAudioFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [validationError, setValidationError] = useState(null);

  // Called by FileUpload (onChange). The FileUpload will pass the File object for non-image files.
  const handleFileUpload = async (file) => {
    if (!file) return;

    const validation = validateAudioFile(file, { maxSizeMB: 5 }); // cap max size to 5MB for localStorage safety
    if (!validation.valid) {
      setValidationError(validation.error);
      setUploadStatus('error');
      return;
    } else {
      setValidationError(null);
    }

    setAudioFile(file);
    setUploadStatus('uploading');

    // create ephemeral preview URL immediately for playback while uploading
    try {
      const preview = URL.createObjectURL(file);
      setAudioPreview(preview);
    } catch (e) {
      console.warn('AudioUploadCard -> preview creation failed', e);
      setAudioPreview(null);
    }

    try {
      const result = await dataService.uploadFile(file, 'audio', {
        treeId,
        personId: null,
        userId: currentUser?.uid
      });
      // result: { id, url, type }
      setUploadStatus('success');
      setAudioPreview(result.url); // overwrite preview with persisted url (may be same as data URL)
      if (onAudioUpload) onAudioUpload(file, result.url);
    } catch (err) {
      console.error('AudioUploadCard -> upload failed', err);
      setUploadStatus('error');
      // keep ephemeral preview so user can still listen if available
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleRemoveAudio = () => {
    if (audioPreview && typeof audioPreview === 'string' && audioPreview.startsWith('blob:')) {
      // revoke object URL only if we created it
      try { URL.revokeObjectURL(audioPreview); } catch {}
    }
    setAudioFile(null);
    setUploadStatus('idle');
    setAudioPreview(null);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setValidationError(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="audio-upload-card" padding="0.5rem" borderRadius="16px">
      <Column fitContent gap="16px" padding='0.5rem' alignItems="stretch">
        {storyTitle && (
          <Card className="audio-upload-card__story-title" padding="0.5rem" backgroundColor="var(--color-light-blue)">
            <Text variant="body2" color="var(--color-primary-dark)">
              Story: <strong>{storyTitle}</strong>
            </Text>
          </Card>
        )}

        {!audioFile ? (
          <FileUpload
            onChange={handleFileUpload}
            accept="audio/*"
            label="Upload Audio Story"
            variant="audio"
          />
        ) : (
          <Card className="audio-upload-card__preview" padding="16px" backgroundColor="var(--color-gray-light)">
            <Row padding='0px' fitContent justifyContent="space-between" alignItems="center">
              <Column fitContent gap="4px">
                <Text truncateLines={2} variant="body2" bold>{audioFile.name}</Text>
                <Text variant="caption2" color="var(--color-gray)">
                  {formatFileSize(audioFile.size)}
                </Text>
              </Column>

              <Row padding='0px' gap="8px">
                {audioPreview && (
                  <AudioPlayer
                    audioURL={audioPreview}
                    isActive={isPlaying}
                    onActivate={handlePlayPause}
                  />
                )}
                <Card
                  onClick={handleRemoveAudio}
                  rounded
                  size="35px"
                  backgroundColor="var(--color-danger-light)"
                  alignItems="center"
                  justifyContent="center"
                  style={{ cursor: 'pointer' }}
                  title="Remove audio"
                >
                  <X size={16} color="var(--color-danger)" />
                </Card>
              </Row>
            </Row>

            {audioPreview && uploadStatus === 'success' && (
              <div style={{ marginTop: '12px', width: '100%' }}>
                <WaveformPlayer
                  audioUrl={audioPreview}
                  isPlaying={isPlaying}
                  onTogglePlay={setIsPlaying}
                  onReady={setDuration}
                  onTimeUpdate={setCurrentTime}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.5rem',
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="audio-upload-card__status audio-upload-card__status--uploading">
                <div className="audio-upload-card__progress">
                  <div className="audio-upload-card__progress-bar"></div>
                </div>
                <Text variant="caption2">Uploading...</Text>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="audio-upload-card__status audio-upload-card__status--success">
                <CheckCircle size={16} />
                <Text variant="caption2">Upload successful!</Text>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="audio-upload-card__status audio-upload-card__status--error">
                <X size={16} />
                <Text variant="caption2">{validationError || 'Upload failed. Please try again.'}</Text>
              </div>
            )}
          </Card>
        )}

        <div className="audio-upload-card__instructions">
          <Text variant="caption2" color="var(--color-gray)">
            Supported formats: MP3, WAV, M4A, OGG
          </Text>
          <Text variant="caption2" color="var(--color-gray)">
            Max file size: 5MB
          </Text>
        </div>
      </Column>
    </Card>
  );
}

export default AudioUploadCard;
