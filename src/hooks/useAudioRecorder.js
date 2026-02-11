// components/Audio/AudioHook.js
import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAudioRecorder() {
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | recording | paused | stopped
  const [audioURL, setAudioURL] = useState(null);
  const [error, setError] = useState(null);

  const requestMic = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error('Mic access denied:', err);
      setError('Microphone access denied');
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const hasMic = await requestMic();
      if (!hasMic) return;

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        setError('Audio recording not supported in this browser');
        return;
      }

      audioChunks.current = [];
      const recorder = new MediaRecorder(streamRef.current);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setStatus('stopped');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus('recording');
    } catch (err) {
      console.error('Recording failed:', err);
      setError('Failed to start recording');
    }
  }, [requestMic]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const resetRecording = () => {
    setStatus('idle');
    setAudioURL(null);
    setError(null);
    audioChunks.current = [];
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    status,
    audioURL,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
