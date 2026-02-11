// components/Audio/RecordingControls.jsx
import React, { useState, useEffect } from 'react';
import Button from '../../Button';
import RecordingIcon from '../../RecordingIcon';
import { Pause, Mic } from 'lucide-react';

const RecordingControls = ({
  onStart,
  onPause,
  onStop,
  onRestart,
  onUpload,
  status,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    setIsRecording(status === 'recording');
    setIsStopped(status === 'stopped');
  }, [status]);

  const handleToggleRecord = () => {
    if (isStopped) return;
    if (isRecording) onPause?.();
    else onStart?.();
  };

  return (
    <div className="recording-controls" style={{ textAlign: 'center', marginTop: '1rem' }}>
      <RecordingIcon 
        isRecording={isRecording} 
        isPaused={status === 'paused'}
        onClick={handleToggleRecord}
      >
        {isRecording ? <Pause size={18} /> : <Mic size={18} />}
      </RecordingIcon>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button variant="danger" onClick={onStop} disabled={isStopped || !isRecording}>
          Stop
        </Button>
        <Button variant="secondary" onClick={onRestart} disabled={!isStopped}>
          Restart
        </Button>
        <Button variant="primary" onClick={onUpload} disabled={!isStopped}>
          Upload
        </Button>
      </div>
    </div>
  );
};

export default RecordingControls;