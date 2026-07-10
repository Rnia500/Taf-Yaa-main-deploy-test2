import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Square, Play, Pause, Send, X,
  CheckCircle, AlertCircle, Info, ChevronDown,
  Globe, Loader, Edit3, Volume2, Trash2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { transcribeAudio, getGroupedLanguages, RECORDING_LANGUAGES } from '../services/transcribeService';

const css = `
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
  @keyframes wave    { 0%,100%{height:8px} 50%{height:28px} }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .vsr-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .vsr-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .vsr-btn:disabled{opacity:.5;cursor:not-allowed;}
  .vsr-textarea { width:100%;padding:12px 14px;font-size:14px;border-radius:12px;outline:none;resize:vertical;min-height:100px;box-sizing:border-box;font-family:inherit;line-height:1.6;transition:border-color .15s; }
  .vsr-textarea:focus { border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.12)!important; }
  .wave-bar { width:4px;border-radius:4px;background:#16a34a;animation:wave 0.8s ease infinite; }
  .lang-option { display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;transition:background .12s;border-radius:8px; }
  .lang-option:hover { background:rgba(22,163,74,.08); }
`;

function WaveAnimation() {
  const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0];
  return (
    <div style={{display:'flex',alignItems:'center',gap:3,height:36}}>
      {delays.map((d,i)=>(
        <div key={i} className="wave-bar" style={{animationDelay:`${d}s`}}/>
      ))}
    </div>
  );
}

function Timer({ seconds }) {
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = (seconds%60).toString().padStart(2,'0');
  return <span style={{fontFamily:'monospace',fontSize:18,fontWeight:700,color:'#16a34a'}}>{m}:{s}</span>;
}

// Language selector dropdown
function LanguageSelector({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = RECORDING_LANGUAGES[value];

  useEffect(()=>{
    const handler = (e)=>{ if(ref.current&&!ref.current.contains(e.target))setOpen(false); };
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[]);

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',border:`1.5px solid ${t?.border||'#e5e7eb'}`,borderRadius:10,background:t?.card||'#fff',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:500,color:t?.text||'#111827',transition:'border-color .15s'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#16a34a'}
        onMouseLeave={e=>e.currentTarget.style.borderColor=t?.border||'#e5e7eb'}>
        <span style={{fontSize:18}}>{selected?.flag||'🌍'}</span>
        <span>{selected?.name||'Select language'}</span>
        {selected?.engine==='manual'&&<span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a',fontWeight:600}}>MANUAL</span>}
        {selected?.engine==='aws'&&<span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',fontWeight:600}}>AUTO</span>}
        <ChevronDown size={14} color={t?.textMuted||'#9ca3af'} style={{marginLeft:'auto',transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}/>
      </button>

      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:t?.card||'#fff',border:`1px solid ${t?.border||'#e5e7eb'}`,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.12)',zIndex:100,maxHeight:360,overflowY:'auto',animation:'fadeIn .15s ease'}}>
          {getGroupedLanguages().map((group)=>(
            <div key={group.label}>
              <div style={{padding:'10px 14px 4px',fontSize:11,fontWeight:600,color:t?.textFaint||'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${t?.border||'#f0f0f0'}`,marginBottom:4}}>
                {group.label}
              </div>
              {group.desc&&<div style={{padding:'4px 14px 6px',fontSize:11,color:t?.textMuted||'#9ca3af',fontStyle:'italic'}}>{group.desc}</div>}
              {group.languages.map(lang=>(
                <div key={lang.code} className="lang-option" onClick={()=>{onChange(lang.code);setOpen(false);}}>
                  <span style={{fontSize:18,flexShrink:0}}>{lang.flag}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:t?.text||'#111827'}}>{lang.name}</div>
                    {lang.region&&<div style={{fontSize:11,color:t?.textMuted||'#9ca3af'}}>{lang.region}</div>}
                  </div>
                  {lang.engine==='manual'&&<span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a',fontWeight:600,flexShrink:0}}>MANUAL</span>}
                  {lang.engine==='aws'&&<span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',fontWeight:600,flexShrink:0}}>AUTO</span>}
                  {value===lang.code&&<CheckCircle size={14} color="#16a34a" style={{flexShrink:0}}/>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VoiceStoryRecorder({ personId, treeId, personName, onSaved, onClose, t }) {
  const { currentUser }       = useAuth();
  const [lang, setLang]       = useState('fr-FR');
  const [step, setStep]       = useState('idle'); // idle | recording | processing | manual | preview | saving | saved
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [title, setTitle]     = useState('');
  const [error, setError]     = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isManual, setIsManual] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const audioBlobRef     = useRef(null);

  const MAX_SECONDS = 120; // 2 min max

  // Detect if selected lang needs manual input
  useEffect(()=>{
    const info = RECORDING_LANGUAGES[lang];
    setIsManual(info?.engine === 'manual');
  },[lang]);

  // Timer
  useEffect(()=>{
    if (step === 'recording') {
      timerRef.current = setInterval(()=>{
        setSeconds(s=>{
          if(s>=MAX_SECONDS-1){stopRecording();return MAX_SECONDS;}
          return s+1;
        });
      },1000);
    } else {
      clearInterval(timerRef.current);
    }
    return()=>clearInterval(timerRef.current);
  },[step]);

  const startRecording = async () => {
    try {
      setError('');
      setSeconds(0);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t=>t.stop());
        const blob = new Blob(chunksRef.current, { type:'audio/webm' });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        if (isManual) {
          setStep('manual');
        } else {
          await runTranscription(blob);
        }
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setStep('recording');
    } catch(err) {
      setError('Microphone access denied. Please allow microphone in your browser settings.');
      setStep('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStep('processing');
    }
  };

  const runTranscription = async (blob) => {
    try {
      setStep('processing');
      setError('');
      const result = await transcribeAudio(blob, lang);
      if (result.requiresManualTranscription) {
        setIsManual(true);
        setStep('manual');
      } else {
        setTranscript(result.transcript || '');
        setStep('preview');
      }
    } catch(err) {
      setError(`Transcription failed: ${err.message}`);
      setStep('manual'); // fall back to manual
    }
  };

  const saveStory = async () => {
    if (!transcript.trim()) { setError('Please add some text before saving.'); return; }
    try {
      setStep('saving');
      const storyData = {
        title: title.trim() || `Voice Story — ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`,
        content: transcript.trim(),
        language: lang,
        source: isManual ? 'manual-transcription' : 'aws-transcribe',
        personId: personId || null,
        treeId: treeId || null,
        personName: personName || null,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        hasAudio: !!audioBlobRef.current,
      };
      const ref = await addDoc(collection(db,'stories'), storyData);
      setStep('saved');
      if (onSaved) onSaved({ id: ref.id, ...storyData });
    } catch(err) {
      setError(`Save failed: ${err.message}`);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('idle'); setSeconds(0); setTranscript(''); setTitle(''); setError(''); setAudioUrl(null);
    audioBlobRef.current = null;
  };

  // Shared card style
  const card = {background:t?.card||'#fff',border:`1px solid ${t?.border||'#e5e7eb'}`,borderRadius:16,padding:20};

  return (
    <>
      <style>{css}</style>
      <div style={{animation:'fadeIn .3s ease'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Mic size={20} color="#fff"/>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:t?.text||'#111827'}}>Voice Story Recorder</div>
              <div style={{fontSize:12,color:t?.textMuted||'#9ca3af'}}>
                {personName ? `Recording for ${personName}` : 'Record a family oral history'}
              </div>
            </div>
          </div>
          {onClose&&<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:t?.textMuted||'#9ca3af',padding:6,display:'flex',borderRadius:8}}>
            <X size={18}/>
          </button>}
        </div>

        {/* Error */}
        {error&&(
          <div style={{display:'flex',gap:10,alignItems:'flex-start',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'10px 14px',marginBottom:16,animation:'fadeIn .3s ease'}}>
            <AlertCircle size={15} color="#dc2626" style={{flexShrink:0,marginTop:1}}/>
            <span style={{fontSize:13,color:'#b91c1c',flex:1}}>{error}</span>
            <button onClick={()=>setError('')} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',padding:0}}><X size={14}/></button>
          </div>
        )}

        {/* STEP: IDLE */}
        {step==='idle'&&(
          <div>
            {/* Language selector */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:t?.textMuted||'#9ca3af',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                Recording Language
              </label>
              <LanguageSelector value={lang} onChange={setLang} t={t}/>
            </div>

            {/* Info for manual languages */}
            {isManual&&(
              <div style={{display:'flex',gap:10,alignItems:'flex-start',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'10px 14px',marginBottom:16,animation:'fadeIn .2s ease'}}>
                <Info size={15} color="#d97706" style={{flexShrink:0,marginTop:1}}/>
                <div style={{fontSize:12,color:'#92400e',lineHeight:1.6}}>
                  <strong>{RECORDING_LANGUAGES[lang]?.name}</strong> recording will play back after. You'll type what was said — your voice and text are both saved as the story.
                </div>
              </div>
            )}

            {/* Record button */}
            <div style={{textAlign:'center',padding:'24px 0'}}>
              <button onClick={startRecording}
                style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#14532d,#16a34a)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 4px 20px rgba(22,163,74,.35)',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                <Mic size={32} color="#fff"/>
              </button>
              <div style={{fontSize:14,fontWeight:600,color:t?.text||'#111827',marginBottom:4}}>Tap to start recording</div>
              <div style={{fontSize:12,color:t?.textMuted||'#9ca3af'}}>Maximum 2 minutes · {RECORDING_LANGUAGES[lang]?.name}</div>
            </div>

            {/* Tips */}
            <div style={{...card,marginTop:8}}>
              <div style={{fontSize:12,fontWeight:600,color:t?.text||'#111827',marginBottom:8}}>💡 Tips for a good recording</div>
              {['Speak clearly and not too fast','Find a quiet place with no background noise','Speak naturally as if telling a story to family','You can re-record as many times as you need'].map((tip,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:'#16a34a',flexShrink:0}}/>
                  <span style={{fontSize:12,color:t?.textMuted||'#9ca3af'}}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: RECORDING */}
        {step==='recording'&&(
          <div style={{textAlign:'center',padding:'16px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:24}}>
              <div style={{width:14,height:14,borderRadius:'50%',background:'#ef4444',animation:'pulse 1s infinite'}}/>
              <span style={{fontSize:14,fontWeight:600,color:'#ef4444'}}>Recording…</span>
              <Timer seconds={seconds}/>
            </div>
            <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
              <WaveAnimation/>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:20,height:6,overflow:'hidden',maxWidth:300,margin:'0 auto 24px'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,#16a34a,#22c55e)',width:`${(seconds/MAX_SECONDS)*100}%`,borderRadius:20,transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:12,color:t?.textMuted||'#9ca3af',marginBottom:20}}>
              {MAX_SECONDS-seconds}s remaining · Speak in {RECORDING_LANGUAGES[lang]?.name}
            </div>
            <button onClick={stopRecording} className="vsr-btn"
              style={{background:'#ef4444',color:'#fff',padding:'12px 32px',fontSize:14}}>
              <Square size={16}/> Stop Recording
            </button>
          </div>
        )}

        {/* STEP: PROCESSING */}
        {step==='processing'&&(
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:t?.primaryBg||'#f0fdf4',border:`2px solid ${t?.primaryBorder||'#bbf7d0'}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Loader size={28} color="#16a34a" style={{animation:'spin 1s linear infinite'}}/>
            </div>
            <div style={{fontSize:15,fontWeight:600,color:t?.text||'#111827',marginBottom:8}}>Transcribing your recording…</div>
            <div style={{fontSize:13,color:t?.textMuted||'#9ca3af'}}>AWS Transcribe is processing your {RECORDING_LANGUAGES[lang]?.name} audio. This may take up to 30 seconds.</div>
          </div>
        )}

        {/* STEP: MANUAL (type what you said) */}
        {step==='manual'&&(
          <div style={{animation:'fadeIn .3s ease'}}>
            {audioUrl&&(
              <div style={{...card,marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
                <Volume2 size={20} color="#16a34a"/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:t?.text||'#111827',marginBottom:4}}>Your Recording</div>
                  <audio controls src={audioUrl} style={{width:'100%',height:32}}/>
                </div>
              </div>
            )}
            <div style={{...card,marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <Edit3 size={15} color="#d97706"/>
                <span style={{fontSize:13,fontWeight:600,color:t?.text||'#111827'}}>
                  Type what you said in {RECORDING_LANGUAGES[lang]?.name}
                </span>
              </div>
              <div style={{fontSize:12,color:t?.textMuted||'#9ca3af',marginBottom:12,background:'#fffbeb',padding:'8px 10px',borderRadius:8,border:'1px solid #fde68a'}}>
                ℹ️ Listen to your recording above, then type the words below. Both your voice and text will be saved.
              </div>
              <textarea className="vsr-textarea" value={transcript} onChange={e=>setTranscript(e.target.value)}
                placeholder={`Type your story here in ${RECORDING_LANGUAGES[lang]?.name}…`}
                style={{border:`1.5px solid ${t?.border||'#e5e7eb'}`,background:t?.input||'#f9fafb',color:t?.text||'#111827'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="vsr-btn" onClick={reset} style={{background:t?.bg||'#f9fafb',color:t?.textMuted||'#9ca3af',border:`1px solid ${t?.border||'#e5e7eb'}`}}>
                <Trash2 size={14}/> Re-record
              </button>
              <button className="vsr-btn" onClick={()=>setStep('preview')} disabled={!transcript.trim()}
                style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP: PREVIEW (review & title) */}
        {step==='preview'&&(
          <div style={{animation:'fadeIn .3s ease'}}>
            <div style={{...card,marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <CheckCircle size={16} color="#16a34a"/>
                <span style={{fontSize:13,fontWeight:600,color:'#16a34a'}}>
                  {isManual ? 'Story Ready' : `Transcribed in ${RECORDING_LANGUAGES[lang]?.name}`}
                </span>
                <span style={{fontSize:11,padding:'2px 7px',borderRadius:20,background:isManual?'#fffbeb':'#f0fdf4',color:isManual?'#d97706':'#16a34a',border:`1px solid ${isManual?'#fde68a':'#bbf7d0'}`,fontWeight:600,marginLeft:'auto'}}>
                  {isManual ? '✏️ Manual' : '🎙️ AWS'}
                </span>
              </div>
              <textarea className="vsr-textarea" value={transcript} onChange={e=>setTranscript(e.target.value)}
                placeholder="Your story text…" style={{border:`1.5px solid ${t?.border||'#e5e7eb'}`,background:t?.input||'#f9fafb',color:t?.text||'#111827',marginBottom:10}}/>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:t?.textMuted||'#9ca3af',marginBottom:5}}>Story Title (optional)</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Grandfather's journey from the north…"
                  style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${t?.border||'#e5e7eb'}`,borderRadius:9,fontSize:13,fontFamily:'inherit',outline:'none',background:t?.input||'#f9fafb',color:t?.text||'#111827',boxSizing:'border-box'}}/>
              </div>
            </div>
            {audioUrl&&(
              <div style={{...card,marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:t?.textMuted||'#9ca3af',marginBottom:8}}>Your Recording</div>
                <audio controls src={audioUrl} style={{width:'100%'}}/>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button className="vsr-btn" onClick={reset} style={{background:t?.bg||'#f9fafb',color:t?.textMuted||'#9ca3af',border:`1px solid ${t?.border||'#e5e7eb'}`}}>
                <Trash2 size={14}/> Start Over
              </button>
              <button className="vsr-btn" onClick={saveStory} disabled={!transcript.trim()}
                style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontSize:14}}>
                <Send size={15}/> Save Story
              </button>
            </div>
          </div>
        )}

        {/* STEP: SAVING */}
        {step==='saving'&&(
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{width:56,height:56,border:'3px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 16px'}}/>
            <div style={{fontSize:15,fontWeight:600,color:t?.text||'#111827'}}>Saving your story…</div>
          </div>
        )}

        {/* STEP: SAVED */}
        {step==='saved'&&(
          <div style={{textAlign:'center',padding:'24px 0',animation:'fadeIn .4s ease'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <CheckCircle size={32} color="#fff"/>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:t?.text||'#111827',marginBottom:6}}>Story Saved! 🎉</div>
            <div style={{fontSize:13,color:t?.textMuted||'#9ca3af',marginBottom:20,lineHeight:1.6}}>
              Your story has been preserved and linked to {personName||'the family tree'}.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="vsr-btn" onClick={reset} style={{background:t?.primaryBg||'#f0fdf4',color:'#16a34a',border:`1px solid ${t?.primaryBorder||'#bbf7d0'}`}}>
                <Mic size={14}/> Record Another
              </button>
              {onClose&&<button className="vsr-btn" onClick={onClose} style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                Done ✓
              </button>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}