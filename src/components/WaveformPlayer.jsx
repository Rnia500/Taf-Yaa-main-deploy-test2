import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, isPlaying, onTogglePlay, onReady, onTimeUpdate }) => {
  const waveformRef = useRef(null);
  const waveSurfer = useRef(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    waveSurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "var(--color-danger)",
      progressColor: '#007bff',
      height: 10,
      barWidth: 2,
      responsive: true,
    });

    waveSurfer.current.load(audioUrl);

    waveSurfer.current.on('ready', () => {
      const duration = waveSurfer.current.getDuration();
      if (onReady) onReady(duration);
    });

    waveSurfer.current.on('audioprocess', () => {
      if (onTimeUpdate && waveSurfer.current.isPlaying()) {
        const time = waveSurfer.current.getCurrentTime();
        onTimeUpdate(time);
      }
    });

    waveSurfer.current.on('finish', () => {
      onTogglePlay(false);
    });

    return () => {
      waveSurfer.current.destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!waveSurfer.current) return;
    if (isPlaying) waveSurfer.current.play();
    else waveSurfer.current.pause();
  }, [isPlaying]);

  return <div ref={waveformRef} style={{ width: '100%' }} />;
};

export default WaveformPlayer;
