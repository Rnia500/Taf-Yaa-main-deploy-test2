import React, { useState, useEffect, useRef } from 'react';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const RecordingTimer = ({ isPaused = false, resetKey = '', isStopped = false }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPaused && !isStopped) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, isStopped]);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  return (
    <div style={{
      fontSize: '1.25rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: '0.5rem',
      marginBottom: '1rem'
    }}>
      {formatTime(seconds)}
    </div>
  );
};

export default RecordingTimer;