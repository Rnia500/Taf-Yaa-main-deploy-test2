// AWS Transcribe (major langs) + OpenAI Whisper (African langs) hybrid

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Square, Play, Pause, RotateCcw,
  Wand2, CheckCircle, AlertTriangle, X, Globe,
  ChevronDown, Volume2, Loader, Languages, Sparkles
} from 'lucide-react';
import { transcribeService } from '../services/transcribeService';
import { useAuth } from '../context/AuthContext';

// ─── Injected styles ──────────────────────────────────────────────────────────
const css = `
  @keyframes vsr-pulse {
    0%   { transform:scale(1);   opacity:0.7; }
    100% { transform:scale(1.75);opacity:0; }
  }
  @keyframes vsr-wave {
    0%,100% { transform:scaleY(0.3); }
    50%     { transform:scaleY(1);   }
  }
  @keyframes vsr-spin   { to { transform:rotate(360deg); } }
  @keyframes vsr-fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes vsr-glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(201,115,30,0); }
    50%     { box-shadow: 0 0 0 12px rgba(201,115,30,0.15); }
  }

  .vsr-root {
    font-family: inherit;
    animation: vsr-fadeUp .35s ease;
  }

  /* Language selector pill */
  .vsr-lang-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:30px; font-size:12px; font-weight:600;
    border:1.5px solid var(--color-gray-light,#e5e7eb);
    background:#fff; color:#374151; cursor:pointer;
    transition:all .2s;
  }
  .vsr-lang-btn:hover { border-color:var(--color-primary1,#16a34a); color:var(--color-primary1,#16a34a); }

  /* Language dropdown */
  .vsr-lang-dropdown {
    position:absolute; top:calc(100% + 8px); left:0; z-index:999;
    background:#fff; border:1.5px solid #e5e7eb;
    border-radius:16px; overflow:hidden;
    box-shadow:0 12px 40px rgba(0,0,0,0.14);
    min-width:280px; animation:vsr-fadeUp .2s ease;
  }
  .vsr-lang-group-label {
    padding:10px 16px 4px;
    font-size:10px; font-weight:700; letter-spacing:0.08em;
    text-transform:uppercase; color:#9ca3af;
  }
  .vsr-lang-option {
    display:flex; align-items:center; justify-content:space-between;
    padding:9px 16px; font-size:13px; cursor:pointer;
    transition:background .12s;
  }
  .vsr-lang-option:hover { background:#f9faf8; }
  .vsr-lang-option.active { background:#f0fdf4; color:var(--color-primary1,#16a34a); font-weight:600; }
  .vsr-lang-badge {
    font-size:10px; padding:2px 8px; border-radius:20px; font-weight:600;
  }
  .badge-aws   { background:#dbeafe; color:#1d4ed8; }
  .badge-whisper { background:#fef3c7; color:#92400e; }

  /* Big record button */
  .vsr-record-btn {
    position:relative; width:80px; height:80px;
    border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:transform .15s, box-shadow .15s;
  }
  .vsr-record-btn:hover:not(:disabled) { transform:scale(1.06); }
  .vsr-record-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* Wave bars */
  .vsr-bars { display:flex; align-items:center; gap:4px; height:40px; }
  .vsr-bar {
    width:5px; border-radius:6px;
    transform-origin:bottom;
    transition:background .3s;
  }

  /* Control buttons */
  .vsr-ctrl {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    padding:10px 20px; border-radius:12px; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s;
  }
  .vsr-ctrl:hover:not(:disabled) { filter:brightness(0.9); transform:translateY(-1px); }
  .vsr-ctrl:disabled { opacity:0.45; cursor:not-allowed; }
  .vsr-ctrl-primary {
    background:linear-gradient(135deg,var(--color-primary2,#1F724A),var(--color-primary1,#16a34a));
    color:#fff;
    box-shadow:0 4px 14px rgba(22,163,74,0.3);
  }
  .vsr-ctrl-secondary { background:#f3f4f6; color:#374151; }
  .vsr-ctrl-danger { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
  .vsr-ctrl-amber  { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }

  /* Transcript textarea */
  .vsr-transcript {
    width:100%; min-height:110px;
    padding:14px 16px; border-radius:14px; font-size:14px;
    line-height:1.75; color:#111827; resize:vertical;
    border:1.5px solid #e5e7eb; outline:none;
    font-family:inherit; box-sizing:border-box;
    transition:border-color .15s, box-shadow .15s;
    background:#fafafa;
  }
  .vsr-transcript:focus {
    border-color:var(--color-primary1,#16a34a);
    box-shadow:0 0 0 3px rgba(22,163,74,0.1);
    background:#fff;
  }

  /* Progress bar */
  .vsr-progress-track {
    height:6px; border-radius:20px;
    background:linear-gradient(90deg,#dcfce7,#bbf7d0);
    overflow:hidden;
  }
  .vsr-progress-fill {
    height:100%; border-radius:20px;
    background:linear-gradient(90deg,var(--color-primary1,#16a34a),#22c55e);
    transition:width .5s ease;
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaveBars({ active, color = '#16a34a' }) {
  return (
    <div className="vsr-bars">
      {[0.5, 0.8, 1, 0.7, 0.9, 0.6, 1].map((h, i) => (
        <div key={i} className="vsr-bar" style={{
          background: active ? color : '#d1d5db',
          animation: active ? `vsr-wave ${0.6 + i * 0.08}s ease ${i * 0.07}s infinite` : 'none',
          height: active ? undefined : `${h * 12}px`,
          minHeight: active ? `${h * 12}px` : undefined,
        }}/>
      ))}
    </div>
  );
}

function Timer({ seconds }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return (
    <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:700, fontSize:22, color:'#111827', letterSpacing:1 }}>
      {m}:{s}
    </span>
  );
}

function ProgressBar({ label, percent }) {
  return (
    <div style={{ animation:'vsr-fadeUp .3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:14, height:14, border:'2px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'vsr-spin .7s linear infinite', flexShrink:0 }}/>
        <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>{label}</span>
      </div>
      <div className="vsr-progress-track">
        <div className="vsr-progress-fill" style={{ width:`${percent}%` }}/>
      </div>
    </div>
  );
}

// ─── Language Selector ────────────────────────────────────────────────────────

function LanguageSelector({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const lang = transcribeService.languages.find(l => l.code === language) || transcribeService.languages[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const globalLangs  = transcribeService.languages.filter(l => l.group === 'global');
  const africanLangs = transcribeService.languages.filter(l => l.group === 'african');

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button className="vsr-lang-btn" onClick={() => setOpen(o => !o)}>
        <Globe size={13}/>
        {lang.flag} {lang.label}
        {transcribeService.isAfricanLanguage(language) && (
          <span style={{ fontSize:10, background:'#fef3c7', color:'#92400e', padding:'1px 6px', borderRadius:20, fontWeight:700 }}>Whisper</span>
        )}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}/>
      </button>

      {open && (
        <div className="vsr-lang-dropdown">
          {/* Global languages */}
          <div className="vsr-lang-group-label">🌐 Global Languages</div>
          {globalLangs.map(l => (
            <div key={l.code} className={`vsr-lang-option ${l.code === language ? 'active' : ''}`}
              onClick={() => { onChange(l.code); setOpen(false); }}>
              <span>{l.flag} {l.label}</span>
              <span className="vsr-lang-badge badge-aws">AWS</span>
            </div>
          ))}
          {/* African languages */}
          <div style={{ borderTop:'1px solid #f3f4f6' }}/>
          <div className="vsr-lang-group-label">🌍 African Languages</div>
          {africanLangs.map(l => (
            <div key={l.code} className={`vsr-lang-option ${l.code === language ? 'active' : ''}`}
              onClick={() => { onChange(l.code); setOpen(false); }}>
              <div>
                <div style={{ fontWeight:l.code === language ? 700 : 500 }}>{l.flag} {l.label}</div>
                {l.region && <div style={{ fontSize:11, color:'#9ca3af' }}>{l.region}</div>}
              </div>
              <span className={`vsr-lang-badge ${l.provider === 'whisper' ? 'badge-whisper' : 'badge-aws'}`}>
                {l.provider === 'whisper' ? 'Whisper AI' : 'AWS'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const VoiceStoryRecorder = ({
  treeId,
  personId,
  personName = 'this person',
  onStorySaved,
  onTranscript,
  compact = false,
  autoStart = false,
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [recState, setRecState]         = useState('idle');
  const [seconds, setSeconds]           = useState(0);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [audioUrl, setAudioUrl]         = useState(null);
  const [isPlayingBack, setPlayingBack] = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [language, setLanguage]         = useState('en');
  const [progress, setProgress]         = useState({ label:'', percent:0 });
  const [error, setError]               = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const audioRef         = useRef(null);
  const streamRef        = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    if (recState === 'recording') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [recState]);

  useEffect(() => { if (autoStart) startRecording(); }, []);

  const startRecording = async () => {
    try {
      setError(null); setTranscript(''); setAudioBlob(null);
      setAudioUrl(null); setSeconds(0); chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250); setRecState('recording');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
    setRecState('stopped');
  };

  const togglePause = () => {
    if (recState === 'recording') { mediaRecorderRef.current?.pause(); setRecState('paused'); }
    else if (recState === 'paused') { mediaRecorderRef.current?.resume(); setRecState('recording'); }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    try {
      setRecState('processing'); setError(null);
      const result = await transcribeService.processAudio({
        audioBlob, userId, treeId, personId, language,
        onProgress: (label, percent) => setProgress({ label, percent }),
      });
      setTranscript(result.transcript); setRecState('done');
      if (result.storyId) onStorySaved?.({ storyId: result.storyId, transcript: result.transcript });
      else onTranscript?.(result.transcript);
    } catch (err) {
      setError(`Transcription failed: ${err.message}`); setRecState('stopped');
    }
  };

  const reset = () => {
    setRecState('idle'); setSeconds(0); setAudioBlob(null); setAudioUrl(null);
    setTranscript(''); setError(null); setProgress({ label:'', percent:0 }); chunksRef.current = [];
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingBack) { audioRef.current.pause(); setPlayingBack(false); }
    else { audioRef.current.play(); setPlayingBack(true); audioRef.current.onended = () => setPlayingBack(false); }
  };

  const isRecording  = recState === 'recording';
  const isPaused     = recState === 'paused';
  const isStopped    = recState === 'stopped';
  const isProcessing = recState === 'processing';
  const isDone       = recState === 'done';
  const isIdle       = recState === 'idle';
  const isActive     = isRecording || isPaused;
  const isAfricanLang = transcribeService.isAfricanLanguage(language);

  // Accent color for current language group
  const accentColor = isAfricanLang ? '#C9731E' : '#16a34a';
  const accentDark  = isAfricanLang ? '#8B5E3C' : '#14532d';

  return (
    <>
      <style>{css}</style>
      {audioUrl && <audio ref={audioRef} src={audioUrl} style={{ display:'none' }}/>}

      <div className="vsr-root" style={{
        background:'#fff',
        border:'1.5px solid #ede8df',
        borderRadius: compact ? 16 : 24,
        overflow:'hidden',
        boxShadow:'0 4px 24px rgba(0,0,0,0.07)',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          background:`linear-gradient(135deg, ${accentDark}, ${accentColor})`,
          padding: compact ? '16px 20px' : '20px 26px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          transition:'background .4s',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:42, height:42, borderRadius:14,
              background:'rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, backdropFilter:'blur(4px)',
            }}>
              {isAfricanLang ? <Languages size={20} color="#fff"/> : <Mic size={20} color="#fff"/>}
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:compact ? 14 : 15, fontWeight:700, color:'#fff' }}>
                Voice Story Recorder
              </h3>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(255,255,255,0.7)', lineHeight:1.4 }}>
                {isAfricanLang
                  ? `Transcribing with Whisper AI · ${transcribeService.languages.find(l => l.code === language)?.label}`
                  : `Record a voice memory for ${personName}`}
              </p>
            </div>
          </div>
          {/* Provider badge top-right */}
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.15)', padding:'4px 10px', borderRadius:20 }}>
            {isAfricanLang ? '🌍 Whisper AI' : '☁️ AWS'}
          </div>
        </div>

        <div style={{ padding: compact ? '18px 20px' : '22px 26px' }}>

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start', animation:'vsr-fadeUp .3s ease' }}>
              <AlertTriangle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:13, color:'#b91c1c', lineHeight:1.5, flex:1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:0 }}>
                <X size={14}/>
              </button>
            </div>
          )}

          {/* ── Language selector ──────────────────────────────────────── */}
          {(isIdle || isStopped) && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>Language:</span>
              <LanguageSelector language={language} onChange={setLanguage}/>
              {isAfricanLang && (
                <span style={{ fontSize:11, color:'#92400e', background:'#fef9ee', border:'1px solid #fde68a', padding:'3px 10px', borderRadius:20, fontWeight:600 }}>
                  ✨ AI-powered African language
                </span>
              )}
            </div>
          )}

          {/* ── Visualizer (recording/paused/stopped) ─────────────────── */}
          {!isIdle && !isProcessing && !isDone && (
            <div style={{
              background: isRecording ? (isAfricanLang ? '#fff8f0' : '#f0fdf4') : '#f9fafb',
              border:`1.5px solid ${isRecording ? (isAfricanLang ? '#fed7aa' : '#bbf7d0') : '#e5e7eb'}`,
              borderRadius:18, padding:'24px 20px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:14,
              marginBottom:20, transition:'all .3s',
              animation:'vsr-fadeUp .3s ease',
            }}>

              {/* Big mic button with pulse ring */}
              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {isRecording && (
                  <div style={{
                    position:'absolute', width:80, height:80, borderRadius:'50%',
                    background: isAfricanLang ? 'rgba(201,115,30,0.2)' : 'rgba(22,163,74,0.2)',
                    animation:'vsr-pulse .9s ease-out infinite',
                  }}/>
                )}
                <div style={{
                  width:72, height:72, borderRadius:'50%',
                  background: isRecording
                    ? `linear-gradient(135deg,${accentDark},${accentColor})`
                    : isPaused ? '#f59e0b'
                    : '#e5e7eb',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: isRecording ? `0 6px 20px ${isAfricanLang ? 'rgba(201,115,30,0.35)' : 'rgba(22,163,74,0.35)'}` : 'none',
                  transition:'all .3s',
                }}>
                  {isRecording && <Mic size={28} color="#fff"/>}
                  {isPaused && <Pause size={26} color="#fff"/>}
                  {isStopped && <Volume2 size={26} color="#6b7280"/>}
                </div>
              </div>

              <WaveBars active={isRecording} color={accentColor}/>
              <Timer seconds={seconds}/>

              <div style={{
                display:'flex', alignItems:'center', gap:6,
                fontSize:12, fontWeight:700, letterSpacing:0.3,
                color: isRecording ? accentColor : isPaused ? '#d97706' : '#6b7280',
              }}>
                {isRecording && <><span style={{ width:7, height:7, borderRadius:'50%', background:accentColor, display:'inline-block', animation:'vsr-pulse .9s infinite' }}/> Recording</>}
                {isPaused && '⏸ Paused'}
                {isStopped && '⏹ Ready to transcribe'}
              </div>
            </div>
          )}

          {/* ── Processing ─────────────────────────────────────────────── */}
          {isProcessing && (
            <div style={{ marginBottom:20, background:'#f0fdf4', borderRadius:14, padding:'18px 20px', animation:'vsr-fadeUp .3s ease' }}>
              <ProgressBar label={progress.label || 'Processing audio…'} percent={progress.percent}/>
              <p style={{ margin:'10px 0 0', fontSize:12, color:'#6b7280', textAlign:'center' }}>
                {isAfricanLang ? 'Sending to Whisper AI — African language processing…' : 'Uploading to AWS Transcribe…'}
              </p>
            </div>
          )}

          {/* ── Transcript result ──────────────────────────────────────── */}
          {isDone && (
            <div style={{ marginBottom:20, animation:'vsr-fadeUp .4s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'10px 14px', background:'#f0fdf4', borderRadius:12 }}>
                <CheckCircle size={16} color="#16a34a"/>
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>Transcription complete! </span>
                  <span style={{ fontSize:12, color:'#6b7280' }}>Edit the text below if needed.</span>
                </div>
              </div>
              <textarea
                className="vsr-transcript"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Transcript will appear here…"
              />
            </div>
          )}

          {/* ── Playback ───────────────────────────────────────────────── */}
          {(isStopped || isDone) && audioUrl && (
            <div style={{ marginBottom:14 }}>
              <button className="vsr-ctrl vsr-ctrl-secondary" onClick={togglePlayback}
                style={{ width:'100%', justifyContent:'center' }}>
                {isPlayingBack ? <><Pause size={14}/> Pause Playback</> : <><Play size={14}/> Play Recording</>}
              </button>
            </div>
          )}

          {/* ── Idle: big start button ─────────────────────────────────── */}
          {isIdle && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'8px 0' }}>
              <button
                onClick={startRecording}
                style={{
                  position:'relative', width:88, height:88, borderRadius:'50%', border:'none',
                  background:`linear-gradient(135deg,${accentDark},${accentColor})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', boxShadow:`0 8px 24px ${isAfricanLang ? 'rgba(201,115,30,0.4)' : 'rgba(22,163,74,0.4)'}`,
                  animation:'vsr-glow 2.5s ease infinite',
                  transition:'transform .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.07)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              >
                <Mic size={34} color="#fff"/>
              </button>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Tap to record</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>
                  Speak clearly · Max 4 minutes
                </div>
              </div>
            </div>
          )}

          {/* ── Controls ──────────────────────────────────────────────── */}
          {isActive && (
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className={`vsr-ctrl ${isPaused ? 'vsr-ctrl-primary' : 'vsr-ctrl-amber'}`}
                onClick={togglePause} style={{ flex:1, justifyContent:'center' }}>
                {isPaused ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}
              </button>
              <button className="vsr-ctrl vsr-ctrl-danger" onClick={stopRecording} style={{ flex:1, justifyContent:'center' }}>
                <Square size={14}/> Stop
              </button>
            </div>
          )}

          {isStopped && (
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className="vsr-ctrl vsr-ctrl-primary" onClick={handleTranscribe}
                style={{ flex:2, justifyContent:'center', padding:'12px 20px' }}>
                <Sparkles size={15}/> Transcribe with AI
              </button>
              <button className="vsr-ctrl vsr-ctrl-secondary" onClick={reset}>
                <RotateCcw size={14}/> Retry
              </button>
            </div>
          )}

          {isDone && (
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className="vsr-ctrl vsr-ctrl-secondary" onClick={reset}>
                <RotateCcw size={14}/> Record Again
              </button>
              <button className="vsr-ctrl vsr-ctrl-primary"
                onClick={() => { onTranscript?.(transcript); reset(); }}
                style={{ flex:1, justifyContent:'center' }}>
                <CheckCircle size={14}/> Use This Text
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VoiceStoryRecorder;