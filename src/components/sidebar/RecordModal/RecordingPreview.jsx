// components/Audio/RecordingPreview.jsx
import React, { useState } from 'react';
import WaveformPlayer from '../../WaveformPlayer';
import { Play, Pause } from 'lucide-react';
import Card from '../../../layout/containers/Card';

const RecordingPreview = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      {/* Controls */}
      <Card
        onClick={() => setIsPlaying((prev) => !prev)}
        rounded
        size="35px"
        backgroundColor="var(--color-secondary1)"
        alignItems="center"
        justifyContent="center"
        style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
      >
        {isPlaying ? (
          <Pause size={18} fill="var(--color-primary-text)" />
        ) : (
          <Play size={18} fill="var(--color-primary-text)" />
        )}
      </Card>

      {/* Waveform */}
      <WaveformPlayer
        audioUrl={audioUrl}
        isPlaying={isPlaying}
        onTogglePlay={setIsPlaying}
        onReady={setDuration}
        onTimeUpdate={setCurrentTime}
      />

      {/* Timer */}
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
  );
};

export default RecordingPreview;
