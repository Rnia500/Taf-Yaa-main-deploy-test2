import React from 'react';
import '../styles/RecordingIcon.css';
import { Pause, Mic } from 'lucide-react';

const RecordingIcon = ({ isRecording, isPaused, onClick }) => {
  return (
    <div
      className={`recording-icon ${isRecording ? 'pulsing' : ''} ${isPaused ? 'paused' : ''}`}
      onClick={onClick}
    />
    
  );
};

export default RecordingIcon;
