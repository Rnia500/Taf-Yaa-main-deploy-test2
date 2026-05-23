// src/components/VoiceStoryRecorder.jsx
// Taf'Yaa — Voice Story Recorder (v2)
// Dual engine: AWS Transcribe (main languages) + OpenAI Whisper (African languages)
// Beautiful inline UI — no more alert() popups!

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, Square, Play, Pause, RotateCcw, Wand2,
  CheckCircle, AlertTriangle, X, Globe, ChevronDown,
  Copy, BookOpen, Save, Languages
} from 'lucide-react';
import { transcribeService } from '../services/transcribeService';
import { useAuth } from '../context/AuthContext';

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  // AWS Transcribe (main languages)
  { code: 'en', name: 'English',     flag: '🇬🇧', engine: 'aws',    awsCode: 'en-US' },
  { code: 'fr', name: 'French',      flag: '🇫🇷', engine: 'aws',    awsCode: 'fr-FR' },
  { code: 'ar', name: 'Arabic',      flag: '🇸🇦', engine: 'aws',    awsCode: 'ar-SA' },
  { code: 'es', name: 'Spanish',     flag: '🇪🇸', engine: 'aws',    awsCode: 'es-ES' },
  { code: 'de', name: 'German',      flag: '🇩🇪', engine: 'aws',    awsCode: 'de-DE' },
  { code: 'pt', name: 'Portuguese',  flag: '🇧🇷', engine: 'aws',    awsCode: 'pt-BR' },
  // OpenAI Whisper (African languages)
  { code: 'ha', name: 'Hausa',       flag: '🌍', engine: 'whisper', whisperCode: 'ha' },
  { code: 'yo', name: 'Yoruba',      flag: '🌍', engine: 'whisper', whisperCode: 'yo' },
  { code: 'sw', name: 'Swahili',     flag: '🌍', engine: 'whisper', whisperCode: 'sw' },
  { code: 'am', name: 'Amharic',     flag: '🌍', engine: 'whisper', whisperCode: 'am' },
  { code: 'zu', name: 'Zulu',        flag: '🌍', engine: 'whisper', whisperCode: 'zu' },
  { code: 'ig', name: 'Igbo',        flag: '🌍', engine: 'whisper', whisperCode: 'ig' },
  { code: 'so', name: 'Somali',      flag: '🌍', engine: 'whisper', whisperCode: 'so' },
  // Manual fallback (unsupported dialects)
  { code: 'ff', name: 'Fulfulde',    flag: '🌍', engine: 'manual'  },
  { code: 'bm', name: 'Bambara',     flag: '🌍', engine: 'manual'  },
  { code: 'ln', name: 'Lingala',     flag: '🌍', engine: 'manual'  },
];

// CSS
const css = `
  @keyframes pulse-ring {
    0%   { transform:scale(1);   opacity:0.8; }
    100% { transform:scale(1.6); opacity:0;   }
  }
  @keyframes wave {
    0%,100% { height:6px; }
    50%      { height:26px; }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0);   }
  }
  @keyframes slideDown {
    from { opacity:0; transform:translateY(-8px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  .vsr-action-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s; font-family:inherit;
  }
  .vsr-action-btn:hover:not(:disabled) { filter:brightness(0.9); transform:scale(0.98); }
  .vsr-action-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .vsr-select {
    padding:9px 32px 9px 10px; font-size:13px; border:1.5px solid #e5e7eb;
    border-radius:10px; background:#fff; color:#374151; cursor:pointer;
    outline:none; appearance:none; transition:border-color .15s; font-family:inherit;
  }
  .vsr-select:focus { border-color:#16a34a; }
  .vsr-textarea {
    width:100%; min-height:100px; padding:12px 14px; font-size:14px;
    border:1.5px solid #e5e7eb; border-radius:10px; font-family:inherit;
    line-height:1.7; color:#111827; resize:vertical; outline:none;
    transition:border-color .15s, box-shadow .15s; box-sizing:border-box;
  }
  .vsr-textarea:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,0.12); }
  .vsr-manual-input {
    width:100%; padding:12px 14px; font-size:14px; border:1.5px solid #e5e7eb;
    border-radius:10px; font-family:inherit; outline:none;
    transition:border-color .15s; box-sizing:border-box;
  }
  .vsr-manual-input:focus { border-color:#16a34a; }
`;

// Wave bars animation
function WaveBars({ active }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:28 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:4, borderRadius:4,
          background: active ? '#16a34a' : '#d1d5db',
          height: active ? undefined : 6,
          animation: active ? `wave .8s ease ${i*0.12}s infinite` : 'none',
          transition:'background .3s',
        }}/>
      ))}
    </div>
  );
}

// Timer display
function Timer({ seconds }) {
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  return (
    <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:700, fontSize:22, color:'#111827' }}>
      {m}:{s}
    </span>
  );
}

// Progress bar
function Progress({ label, percent }) {
  return (
    <div style={{ animation:'fadeIn .3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:15, height:15, border:'2px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
        <span style={{ fontSize:13, color:'#15803d', fontWeight:500 }}>{label}</span>
      </div>
      <div style={{ background:'#dcfce7', borderRadius:20, height:5, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${percent}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:20, transition:'width .5s ease' }}/>
      </div>
    </div>
  );
}

// Engine badge
function EngineBadge({ engine }) {
  const map = {
    aws:     { label:'AWS Transcribe', bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' },
    whisper: { label:'OpenAI Whisper', bg:'#f0f9ff', color:'#0369a1', border:'#bae6fd' },
    manual:  { label:'Manual Input',   bg:'#faf5ff', color:'#7c3aed', border:'#ddd6fe' },
  };
  const s = map[engine] || map.manual;
  return (
    <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const VoiceStoryRecorder = ({
  treeId, personId, personName = 'this person',
  onStorySaved, onTranscript, compact = false,
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [recState, setRecState]       = useState('idle');
  const [seconds, setSeconds]         = useState(0);
  const [audioBlob, setAudioBlob]     = useState(null);
  const [audioUrl, setAudioUrl]       = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [lang, setLang]               = useState('en');
  const [transcript, setTranscript]   = useState('');
  const [manualText, setManualText]   = useState('');
  const [progress, setProgress]       = useState({ label:'', percent:0 });
  const [error, setError]             = useState(null);
  const [copied, setCopied]           = useState(false);
  const [savedStoryId, setSavedStoryId] = useState(null);

  const mrRef    = useRef(null);
  const chunksRef= useRef([]);
  const timerRef = useRef(null);
  const streamRef= useRef(null);
  const audioRef = useRef(null);

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const isManual     = selectedLang.engine === 'manual';
  const isRecording  = recState === 'recording';
  const isPaused     = recState === 'paused';
  const isStopped    = recState === 'stopped';
  const isProcessing = recState === 'processing';
  const isDone       = recState === 'done';
  const isIdle       = recState === 'idle';

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSeconds(s => s+1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null); setTranscript(''); setAudioBlob(null);
      setAudioUrl(null); setSeconds(0); setSavedStoryId(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mrRef.current = mr;
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
      setError('Microphone access denied. Please allow microphone access in your browser.');
    }
  };

  const stopRecording = () => {
    if (mrRef.current?.state !== 'inactive') mrRef.current.stop();
    setRecState('stopped');
  };

  const togglePause = () => {
    if (isRecording) { mrRef.current?.pause(); setRecState('paused'); }
    else if (isPaused) { mrRef.current?.resume(); setRecState('recording'); }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    try {
      setRecState('processing'); setError(null);
      const result = await transcribeService.processAudio({
        audioBlob, userId, treeId, personId,
        language: lang,
        engine: selectedLang.engine,
        onProgress: (label, percent) => setProgress({ label, percent }),
      });
      setTranscript(result.transcript);
      setSavedStoryId(result.storyId || null);
      setRecState('done');
      if (result.storyId) onStorySaved?.({ storyId: result.storyId, transcript: result.transcript });
      else onTranscript?.(result.transcript);
    } catch (err) {
      setError(`Transcription failed: ${err.message}`);
      setRecState('stopped');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    try {
      setRecState('processing');
      setProgress({ label: 'Saving your story…', percent: 60 });
      // Save manual text as story
      setTranscript(manualText);
      setSavedStoryId('manual');
      setRecState('done');
      onTranscript?.(manualText);
    } catch (err) {
      setError(err.message);
      setRecState('idle');
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); audioRef.current.onended = () => setIsPlaying(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setRecState('idle'); setSeconds(0); setAudioBlob(null);
    setAudioUrl(null); setTranscript(''); setManualText('');
    setError(null); setSavedStoryId(null);
    chunksRef.current = [];
  };

  return (
    <>
      <style>{css}</style>
      {audioUrl && <audio ref={audioRef} src={audioUrl} style={{ display:'none' }}/>}

      <div style={{
        background:'#fff', border:'1px solid #e5e7eb',
        borderRadius: compact ? 14 : 18,
        overflow:'hidden', animation:'fadeIn .3s ease',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
      }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          background:'linear-gradient(135deg,#14532d,#166534)',
          padding: compact ? '14px 18px' : '20px 24px',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ width:40, height:40, borderRadius:11, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Mic size={20} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0, fontSize: compact?13:15, fontWeight:700, color:'#fff' }}>
              Voice Story Recorder
            </h3>
            <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(255,255,255,0.65)' }}>
              Record a story for {personName} — we'll convert it to text
            </p>
          </div>
          {!isIdle && (
            <button onClick={reset} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 10px', color:'#fff', fontSize:11, fontFamily:'inherit' }}>
              ✕ Reset
            </button>
          )}
        </div>

        <div style={{ padding: compact ? '14px 18px' : '20px 24px' }}>

          {/* ── Language selector (idle only) ─────────────────────── */}
          {isIdle && (
            <div style={{ marginBottom:18, animation:'slideDown .3s ease' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                Select Language
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ position:'relative', flex:1, minWidth:160 }}>
                  <Globe size={14} color="#9ca3af" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <select className="vsr-select" style={{ paddingLeft:28, width:'100%' }} value={lang} onChange={e => setLang(e.target.value)}>
                    <optgroup label="🌐 Main Languages (AWS Transcribe)">
                      {LANGUAGES.filter(l => l.engine==='aws').map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🌍 African Languages (OpenAI Whisper)">
                      {LANGUAGES.filter(l => l.engine==='whisper').map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="✍️ Manual Input (Unsupported dialects)">
                      {LANGUAGES.filter(l => l.engine==='manual').map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown size={13} color="#9ca3af" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                </div>
                <EngineBadge engine={selectedLang.engine}/>
              </div>

              {/* Manual language notice */}
              {isManual && (
                <div style={{ marginTop:10, background:'#faf5ff', border:'1px solid #ddd6fe', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#7c3aed', lineHeight:1.6 }}>
                  ✍️ <strong>{selectedLang.name}</strong> is not yet supported by automatic transcription.
                  You can type the text manually below and we'll save it as a story.
                </div>
              )}
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'11px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'flex-start', animation:'fadeIn .3s ease' }}>
              <AlertTriangle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:13, color:'#b91c1c', flex:1, lineHeight:1.5 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:0, fontSize:16, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* ── Manual input mode ─────────────────────────────────── */}
          {isManual && isIdle && (
            <div style={{ animation:'fadeIn .3s ease' }}>
              <textarea
                className="vsr-textarea"
                placeholder={`Type the story in ${selectedLang.name}…`}
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                style={{ marginBottom:12 }}
              />
              <button className="vsr-action-btn" onClick={handleManualSubmit} disabled={!manualText.trim()}
                style={{ width:'100%', justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontSize:14 }}>
                <Save size={15}/> Save Story
              </button>
            </div>
          )}

          {/* ── Recording visualizer ──────────────────────────────── */}
          {!isManual && (isRecording || isPaused || isStopped) && (
            <div style={{
              background: isRecording ? '#f0fdf4' : '#f9fafb',
              border: `1.5px solid ${isRecording ? '#bbf7d0' : '#e5e7eb'}`,
              borderRadius:14, padding:'20px 16px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:10,
              marginBottom:16, animation:'fadeIn .3s ease', transition:'all .3s',
            }}>
              {isRecording && (
                <div style={{ position:'relative', width:60, height:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'rgba(22,163,74,0.2)', animation:'pulse-ring .9s ease-out infinite' }}/>
                  <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(22,163,74,0.4)' }}>
                    <Mic size={20} color="#fff"/>
                  </div>
                </div>
              )}
              {isPaused && (
                <div style={{ width:46, height:46, borderRadius:'50%', background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Pause size={20} color="#fff"/>
                </div>
              )}
              {isStopped && (
                <div style={{ width:46, height:46, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Play size={20} color="#6b7280"/>
                </div>
              )}
              <WaveBars active={isRecording}/>
              <Timer seconds={seconds}/>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, color: isRecording?'#16a34a':isPaused?'#d97706':'#9ca3af', fontWeight:600 }}>
                  {isRecording ? '● Recording…' : isPaused ? '⏸ Paused' : '⏹ Ready to transcribe'}
                </span>
                <EngineBadge engine={selectedLang.engine}/>
              </div>
            </div>
          )}

          {/* ── Processing ─────────────────────────────────────────── */}
          {isProcessing && (
            <div style={{ marginBottom:16 }}>
              <Progress label={progress.label || 'Processing…'} percent={progress.percent}/>
            </div>
          )}

          {/* ── Result card ────────────────────────────────────────── */}
          {isDone && transcript && (
            <div style={{
              background:'#f0fdf4', border:'1.5px solid #86efac',
              borderRadius:14, overflow:'hidden', marginBottom:16,
              animation:'fadeIn .4s ease', boxShadow:'0 2px 12px rgba(22,163,74,0.1)',
            }}>
              {/* Result header */}
              <div style={{ background:'linear-gradient(135deg,#16a34a,#22c55e)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle size={16} color="#fff"/>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
                    {savedStoryId ? '✅ Saved as Story!' : '✅ Transcript Ready'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={handleCopy}
                    style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:7, cursor:'pointer', padding:'5px 10px', color:'#fff', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    {copied ? '✓ Copied!' : <><Copy size={12}/> Copy</>}
                  </button>
                </div>
              </div>

              {/* Transcript text */}
              <div style={{ padding:'14px 16px' }}>
                <textarea
                  className="vsr-textarea"
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  style={{ border:'1px solid #bbf7d0', background:'#fff', minHeight:80 }}
                />
                {savedStoryId && savedStoryId !== 'manual' && (
                  <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#16a34a' }}>
                    <BookOpen size={13}/>
                    Story saved to {personName}'s profile — refresh to see it in Stories!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Audio playback ─────────────────────────────────────── */}
          {(isStopped || isDone) && audioUrl && (
            <button className="vsr-action-btn" onClick={togglePlayback}
              style={{ width:'100%', justifyContent:'center', background:'#f3f4f6', color:'#374151', marginBottom:12 }}>
              {isPlaying ? <><Pause size={14}/> Pause Playback</> : <><Play size={14}/> Play Recording</>}
            </button>
          )}

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>

            {isIdle && !isManual && (
              <button className="vsr-action-btn" onClick={startRecording}
                style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontSize:14, padding:'12px 20px' }}>
                <Mic size={16}/> Start Recording
              </button>
            )}

            {(isRecording || isPaused) && (
              <>
                <button className="vsr-action-btn" onClick={togglePause}
                  style={{ flex:1, justifyContent:'center', background: isPaused?'#16a34a':'#f59e0b', color:'#fff' }}>
                  {isPaused ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}
                </button>
                <button className="vsr-action-btn" onClick={stopRecording}
                  style={{ flex:1, justifyContent:'center', background:'#dc2626', color:'#fff' }}>
                  <Square size={14}/> Stop
                </button>
              </>
            )}

            {isStopped && (
              <>
                <button className="vsr-action-btn" onClick={handleTranscribe}
                  style={{ flex:2, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:700 }}>
                  <Wand2 size={15}/> Transcribe with AI
                </button>
                <button className="vsr-action-btn" onClick={reset}
                  style={{ background:'#f3f4f6', color:'#6b7280' }}>
                  <RotateCcw size={14}/>
                </button>
              </>
            )}

            {isDone && (
              <>
                <button className="vsr-action-btn" onClick={reset}
                  style={{ background:'#f3f4f6', color:'#374151' }}>
                  <RotateCcw size={14}/> Record Again
                </button>
                {!savedStoryId && (
                  <button className="vsr-action-btn"
                    onClick={() => { onTranscript?.(transcript); reset(); }}
                    style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff' }}>
                    <Save size={14}/> Use This Text
                  </button>
                )}
              </>
            )}
          </div>

          {/* Hint */}
          {isIdle && !isManual && (
            <p style={{ margin:'12px 0 0', fontSize:11, color:'#9ca3af', textAlign:'center', lineHeight:1.7 }}>
              🎙️ Speak clearly · Max 2 minutes · Language: <strong>{selectedLang.flag} {selectedLang.name}</strong>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default VoiceStoryRecorder;