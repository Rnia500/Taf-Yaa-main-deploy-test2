import React, { useState, useEffect, useRef } from 'react';

function MediaPlayerBox({ file, name = '', style = {}, className = '' }) {
  const [mediaType, setMediaType] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef(null);

useEffect(() => {
  if (!file) {
    setMediaType(null);
    return;
  }

  let type = null;
  if (typeof file === 'string') {
    // URL string: infer type from extension or MIME hint
    let lower = file.toLowerCase();
    let ext = '';
    try {
      const url = new URL(file);
      const pathname = url.pathname || '';
      ext = pathname.split('.').pop().toLowerCase();
    } catch {
      // fallback for invalid URL strings
      ext = file.split('.').pop().toLowerCase();
    }

    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
    else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) type = 'video';
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) type = 'image';
    else if (ext === 'pdf' || lower.includes('.pdf') || lower.includes('pdf?')) type = 'pdf';
  } 
  else if (file instanceof File) {
    if (file.type.startsWith('audio/')) type = 'audio';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('image/')) type = 'image';
    else if (file.type === 'application/pdf') type = 'pdf';
  }

  setMediaType(type);
  setIsPlaying(false);
  setCurrentTime(0);
  setDuration(0);
}, [file]);


  // Handlers for audio/video playback
  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (!mediaRef.current) return;
    setCurrentTime(mediaRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get media source URL
  const getSrc = () => {
    if (!file) return null;
    if (typeof file === 'string') return file;
    if (file instanceof File) return URL.createObjectURL(file);
    return null;
  };

  const src = getSrc();

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (file instanceof File) {
        try {
          URL.revokeObjectURL(src);
        } catch {
          // ignore revoke errors
        }
      }
    };
  }, [file, src]);

  if (!file || !mediaType) {
    return <div className={`media-player-box empty ${className}`} style={{ ...style, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>No media to display</div>;
  }

  return (
    <div className={`media-player-box ${className}`} style={{ ...style, position: 'relative', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#000' }}>
      {mediaType === 'image' && (
        <img
          src={src}
          alt={name || "Media preview"}
          title={name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          draggable={false}
        />
      )}

      {mediaType === 'audio' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222', color: '#fff', padding: '1rem' }}>
          <audio
            ref={mediaRef}
            src={src}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            style={{
              backgroundColor: '#444',
              border: 'none',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '32px',
              color: '#fff',
              userSelect: 'none',
            }}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <div style={{ marginTop: '0.5rem', fontSize: '14px', fontFamily: 'monospace' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {mediaType === 'video' && (
        <video
          ref={mediaRef}
          src={src}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {mediaType === 'pdf' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', color: '#495057', padding: '1rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>📄</div>
          <div style={{ fontSize: '14px', textAlign: 'center', marginBottom: '0.5rem' }}>
            PDF
          </div>
          <div style={{ fontSize: '12px', textAlign: 'center', color: '#6c757d' }}>
            Click download button to view
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaPlayerBox;
