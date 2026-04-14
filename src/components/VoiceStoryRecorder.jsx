// src/components/VoiceStoryRecorder.jsx
// Taf'Yaa — AWS Transcribe Voice Story Recorder
// Drop this component anywhere you want voice-to-text recording

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Square, Play, Pause, RotateCcw,
  Wand2, CheckCircle, AlertTriangle, X, Globe,
  ChevronDown, Volume2, Loader
} from 'lucide-react';
import { transcribeService } from '../services/transcribeService';
import { useAuth } from '../context/AuthContext';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0;   }
  }
  @keyframes wave {
    0%, 100% { height: 8px;  }
    50%       { height: 28px; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .vsr-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s;
  }
  .vsr-btn:hover:not(:disabled) { filter:brightness(0.92); transform:scale(0.98); }
  .vsr-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .vsr-textarea {
    width:100%; min-height:120px; padding:14px 16px;
    border:1.5px solid #e5e7eb; border-radius:12px;
    font-size:14px; line-height:1.7; color:#111827;
    resize:vertical; outline:none; font-family:inherit;
    transition:border-color .15s, box-shadow .15s;
    box-sizing:border-box;
  }
  .vsr-textarea:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,0.12); }

  .vsr-select {
    padding:8px 32px 8px 12px; font-size:13px;
    border:1px solid #e5e7eb; border-radius:8px;
    background:#fff; color:#374151; cursor:pointer;
    outline:none; appearance:none;
  }
  .vsr-select:focus { border-color:#16a34a; }
`;

// ─── Wave animation bars ──────────────────────────────────────────────────────
function WaveBars({ active }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:32 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:4, borderRadius:4,
          background: active ? '#16a34a' : '#d1d5db',
          height: active ? undefined : 8,
          animation: active ? `wave .8s ease ${i * 0.12}s infinite` : 'none',
          transition:'background .3s',
        }}/>
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressStep({ label, percent }) {
  return (
    <div style={{ animation:'fadeIn .3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:16, height:16, border:'2px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
        <span style={{ fontSize:13, color:'#15803d', fontWeight:500 }}>{label}</span>
      </div>
      <div style={{ background:'#dcfce7', borderRadius:20, height:6, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${percent}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:20, transition:'width .5s ease' }}/>
      </div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ seconds }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:700, fontSize:18, color:'#111827' }}>{m}:{s}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const VoiceStoryRecorder = ({
  treeId,
  personId,
  personName = 'this person',
  onStorySaved,    // called with { storyId, transcript } when saved to Firestore
  onTranscript,    // called with transcript text (if you want to handle saving yourself)
  compact = false, // smaller version for embedding in sidebars
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  // Recording state
  const [recState, setRecState]       = useState('idle'); // idle | recording | paused | processing | done | error
  const [seconds, setSeconds]         = useState(0);
  const [audioBlob, setAudioBlob]     = useState(null);
  const [audioUrl, setAudioUrl]       = useState(null);
  const [isPlayingBack, setPlayingBack] = useState(false);

  // Transcription state
  const [transcript, setTranscript]   = useState('');
  const [language, setLanguage]       = useState('en');
  const [progress, setProgress]       = useState({ label:'', percent:0 });
  const [error, setError]             = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const audioRef         = useRef(null);
  const streamRef        = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  // Timer tick
  useEffect(() => {
    if (recState === 'recording') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recState]);

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setAudioBlob(null);
      setAudioUrl(null);
      setSeconds(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(250);
      setRecState('recording');
    } catch (err) {
      setError(`Microphone access denied. Please allow microphone access in your browser.`);
    }
  };

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecState('stopped');
  };

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  const togglePause = () => {
    if (recState === 'recording') {
      mediaRecorderRef.current?.pause();
      setRecState('paused');
    } else if (recState === 'paused') {
      mediaRecorderRef.current?.resume();
      setRecState('recording');
    }
  };

  // ── Transcribe ─────────────────────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    try {
      setRecState('processing');
      setError(null);

      const result = await transcribeService.processAudio({
        audioBlob,
        userId,
        treeId,
        personId,
        language,
        onProgress: (label, percent) => setProgress({ label, percent }),
      });

      setTranscript(result.transcript);
      setRecState('done');

      if (result.storyId) {
        onStorySaved?.({ storyId: result.storyId, transcript: result.transcript });
      } else {
        onTranscript?.(result.transcript);
      }
    } catch (err) {
      setError(`Transcription failed: ${err.message}`);
      setRecState('stopped');
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setRecState('idle');
    setSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setError(null);
    setProgress({ label:'', percent:0 });
    chunksRef.current = [];
  };

  // ── Playback ───────────────────────────────────────────────────────────────
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingBack) {
      audioRef.current.pause();
      setPlayingBack(false);
    } else {
      audioRef.current.play();
      setPlayingBack(true);
      audioRef.current.onended = () => setPlayingBack(false);
    }
  };

  const isRecording   = recState === 'recording';
  const isPaused      = recState === 'paused';
  const isStopped     = recState === 'stopped';
  const isProcessing  = recState === 'processing';
  const isDone        = recState === 'done';
  const isIdle        = recState === 'idle';

  return (
    <>
      <style>{css}</style>
      {audioUrl && <audio ref={audioRef} src={audioUrl} style={{ display:'none' }} />}

      <div style={{
        background:'#fff',
        border:'1px solid #e5e7eb',
        borderRadius: compact ? 14 : 20,
        overflow:'hidden',
        animation:'fadeIn .3s ease',
      }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          background:'linear-gradient(135deg,#14532d,#166534)',
          padding: compact ? '16px 20px' : '22px 28px',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Mic size={20} color="#fff"/>
          </div>
          <div>
            <h3 style={{ margin:0, fontSize: compact ? 14 : 16, fontWeight:700, color:'#fff' }}>
              Voice Story Recorder
            </h3>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(255,255,255,0.65)' }}>
              Record a story for {personName} — we'll convert it to text automatically
            </p>
          </div>
        </div>

        <div style={{ padding: compact ? '16px 20px' : '24px 28px' }}>

          {/* ── Language selector ─────────────────────────────────────── */}
          {isIdle && (
            <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
              <Globe size={15} color="#9ca3af"/>
              <span style={{ fontSize:13, color:'#6b7280', fontWeight:500 }}>Language:</span>
              <div style={{ position:'relative' }}>
                <select className="vsr-select" value={language} onChange={e => setLanguage(e.target.value)}>
                  {transcribeService.languages.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} color="#9ca3af" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              </div>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'12px 14px', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start', animation:'fadeIn .3s ease' }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:13, color:'#b91c1c', lineHeight:1.5 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:0 }}><X size={14}/></button>
            </div>
          )}

          {/* ── Recording visualizer ──────────────────────────────────── */}
          {!isIdle && !isProcessing && !isDone && (
            <div style={{
              background: isRecording ? '#f0fdf4' : '#f9fafb',
              border: `1.5px solid ${isRecording ? '#bbf7d0' : '#e5e7eb'}`,
              borderRadius:14, padding:'20px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:12,
              marginBottom:20, transition:'all .3s',
              animation:'fadeIn .3s ease',
            }}>
              {/* Pulse ring */}
              {isRecording && (
                <div style={{ position:'relative', width:64, height:64, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', width:64, height:64, borderRadius:'50%', background:'rgba(22,163,74,0.2)', animation:'pulse-ring .9s ease-out infinite' }}/>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(22,163,74,0.4)' }}>
                    <Mic size={22} color="#fff"/>
                  </div>
                </div>
              )}
              {isPaused && (
                <div style={{ width:48, height:48, borderRadius:'50%', background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Pause size={22} color="#fff"/>
                </div>
              )}
              {isStopped && (
                <div style={{ width:48, height:48, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Volume2 size={22} color="#6b7280"/>
                </div>
              )}

              <WaveBars active={isRecording} />
              <Timer seconds={seconds} />

              <span style={{ fontSize:12, color: isRecording ? '#16a34a' : isPaused ? '#d97706' : '#6b7280', fontWeight:600 }}>
                {isRecording ? '● Recording…' : isPaused ? '⏸ Paused' : '⏹ Stopped'}
              </span>
            </div>
          )}

          {/* ── Processing ────────────────────────────────────────────── */}
          {isProcessing && (
            <div style={{ marginBottom:20 }}>
              <ProgressStep label={progress.label || 'Processing…'} percent={progress.percent} />
            </div>
          )}

          {/* ── Transcript result ─────────────────────────────────────── */}
          {isDone && (
            <div style={{ marginBottom:20, animation:'fadeIn .4s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <CheckCircle size={16} color="#16a34a"/>
                <span style={{ fontSize:13, fontWeight:600, color:'#15803d' }}>
                  Transcription complete! You can edit the text below.
                </span>
              </div>
              <textarea
                className="vsr-textarea"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Transcript will appear here…"
              />
            </div>
          )}

          {/* ── Audio playback (after stopped) ───────────────────────── */}
          {(isStopped || isDone) && audioUrl && (
            <div style={{ marginBottom:16 }}>
              <button className="vsr-btn" onClick={togglePlayback}
                style={{ background:'#f3f4f6', color:'#374151', width:'100%', justifyContent:'center' }}>
                {isPlayingBack ? <><Pause size={15}/> Pause Playback</> : <><Play size={15}/> Play Recording</>}
              </button>
            </div>
          )}

          {/* ── Action buttons ────────────────────────────────────────── */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {isIdle && (
              <button className="vsr-btn" onClick={startRecording} style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontSize:14, padding:'12px 20px' }}>
                <Mic size={16}/> Start Recording
              </button>
            )}

            {(isRecording || isPaused) && (
              <>
                <button className="vsr-btn" onClick={togglePause} style={{ flex:1, justifyContent:'center', background: isPaused ? '#16a34a' : '#f59e0b', color:'#fff' }}>
                  {isPaused ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}
                </button>
                <button className="vsr-btn" onClick={stopRecording} style={{ flex:1, justifyContent:'center', background:'#dc2626', color:'#fff' }}>
                  <Square size={14}/> Stop
                </button>
              </>
            )}

            {isStopped && (
              <>
                <button className="vsr-btn" onClick={handleTranscribe} style={{ flex:2, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:700 }}>
                  <Wand2 size={15}/> Transcribe with AI
                </button>
                <button className="vsr-btn" onClick={reset} style={{ background:'#f3f4f6', color:'#6b7280' }}>
                  <RotateCcw size={14}/> Retry
                </button>
              </>
            )}

            {isDone && (
              <>
                <button className="vsr-btn" onClick={reset} style={{ background:'#f3f4f6', color:'#374151' }}>
                  <RotateCcw size={14}/> Record Again
                </button>
                <button className="vsr-btn"
                  onClick={() => { onTranscript?.(transcript); reset(); }}
                  style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff' }}>
                  <CheckCircle size={14}/> Use This Text
                </button>
              </>
            )}
          </div>

          {/* Hint */}
          {isIdle && (
            <p style={{ margin:'14px 0 0', fontSize:12, color:'#9ca3af', textAlign:'center', lineHeight:1.6 }}>
              🎙️ Speak clearly · Select your language above · Maximum 4 minutes
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default VoiceStoryRecorder;