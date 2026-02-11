import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import Card from '../layout/containers/Card';

export default function AudioPlayer({ audioURL, isActive, onActivate }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);

  // Setup waveform
  useEffect(() => {
    if (!containerRef.current) return;

    waveSurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#ccc',
      progressColor: '#007bff',
      height: 40,
      barWidth: 2,
      responsive: true,
    });

    waveSurferRef.current.load(audioURL);

    waveSurferRef.current.on('finish', () => {
      onActivate(false);
    });

    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
    };
  }, [audioURL]);

  useEffect(() => {
    if (!waveSurferRef.current) return;

    if (isActive) {
      waveSurferRef.current.play();
    } else {
      waveSurferRef.current.pause();
    }
  }, [isActive]);

  const handleClick = (e) => {
    e.stopPropagation();
    onActivate();
  };

  return (
    <Card
      onClick={handleClick}
      width="auto"
      fitContent
      alignItems="center"
      justifyContent="center"
      backgroundColor="var(--color-transparent)"
      padding="0px"
      margin='4px'
      gap="0.25rem"
    >
      {/* Circle button */}
      <Card
        onClick={handleClick}
        rounded
        size="35px"
        backgroundColor="var(--color-secondary1)"
        alignItems="center"
        justifyContent="center"
      >
        {isActive
          ? <Pause size={15} fill="var(--color-primary-text)" />
          : <Play size={15} fill="var(--color-primary-text)" />
        }
      </Card>
    </Card>
  );
}

