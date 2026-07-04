// src/components/AITreeCompletion.jsx
// FULLY FUNCTIONAL — reads real Firestore tree data and generates smart suggestions

import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain, ChevronRight, X, Check, UserPlus,
  Heart, Users, Calendar, Star, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Info,
  Sparkles, TreePine, BookOpen
} from 'lucide-react';
import {
  collection, onSnapshot, query, where,
  doc, getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .ai-card { border-radius:14px;padding:14px 16px;transition:box-shadow .2s,transform .15s;animation:fadeIn .3s ease; }
  .ai-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08)!important;transform:translateY(-1px); }
  .ai-btn { display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .ai-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .ai-btn:disabled{opacity:.5;cursor:not-allowed;}
  .ai-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px; }
  .ai-progress-bar { height:6px;border-radius:20px;overflow:hidden;background:#f3f4f6; }
  .ai-progress-fill { height:100%;border-radius:20px;transition:width 1s ease; }
`;

// ─── Suggestion types ──────────────────────────────────────────────────────────
const SUGGESTION_TYPES = {
  MISSING_SPOUSE: {
    id: 'missing_spouse',
    icon: '💍',
    color: '#db2777',
    label: 'Missing Spouse',
    priority: 1,
  },
  MISSING_PARENT: {
    id: 'missing_parent',
    icon: '👨‍👩‍👧',
    color: '#2563eb',
    label: 'Missing Parent',
    priority: 2,
  },
  MISSING_GRANDPARENT: {
    id: 'missing_grandparent',
    icon: '👴',
    color: '#7c3aed',
    label: 'Missing Grandparent',
    priority: 3,
  },
  MISSING_BIO: {
    id: 'missing_bio',
    icon: '📝',
    color: '#16a34a',
    label: 'Missing Biography',
    priority: 4,
  },
  MISSING_PHOTO: {
    id: 'missing_photo',
    icon: '📷',
    color: '#0891b2',
    label: 'Missing Photo',
    priority: 5,
  },
  MISSING_BIRTH_DATE: {
    id: 'missing_birth_date',
    icon: '📅',
    color: '#ea580c',
    label: 'Missing Birth Date',
    priority: 6,
  },
  MISSING_STORY: {
    id: 'missing_story',
    icon: '📖',
    color: '#d97706',
    label: 'No Stories Yet',
    priority: 7,
  },
  ISOLATED_PERSON: {
    id: 'isolated_person',
    icon: '🔗',
    color: '#6b7280',
    label: 'Isolated Person',
    priority: 8,
  },
};

// ─── Generate suggestions from real data ──────────────────────────────────────
function generateSuggestions(persons, marriages, stories) {
  const suggestions = [];
  const personMap   = new Map(persons.map(p => [p.id, p]));
  const storyPersonIds = new Set(stories.map(s => s.personId).filter(Boolean));

  // Build relationship maps
  const hasSpouse      = new Set();
  const hasParent      = new Set();
  const personChildren = new Map(); // personId → childrenIds[]

  marriages.forEach(m => {
    if (m.husbandId) hasSpouse.add(m.husbandId);
    // Handle both monogamous and polygamous
    const wives = m.wives || (m.wifeId ? [{ wifeId: m.wifeId, childrenIds: m.childrenIds || [] }] : []);
    wives.forEach(w => {
      if (w.wifeId) hasSpouse.add(w.wifeId);
      const kids = w.childrenIds || m.childrenIds || [];
      kids.forEach(kidId => {
        hasParent.add(kidId);
        if (m.husbandId) {
          if (!personChildren.has(m.husbandId)) personChildren.set(m.husbandId, []);
          personChildren.get(m.husbandId).push(kidId);
        }
        if (w.wifeId) {
          if (!personChildren.has(w.wifeId)) personChildren.set(w.wifeId, []);
          personChildren.get(w.wifeId).push(kidId);
        }
      });
    });
  });

  persons.forEach(person => {
    const name = person.name || 'Unknown';

    // 1. Has children but no spouse recorded
    if (personChildren.has(person.id) && personChildren.get(person.id).length > 0 && !hasSpouse.has(person.id)) {
      suggestions.push({
        id:         `spouse-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_SPOUSE,
        personId:   person.id,
        personName: name,
        title:      `${name} may have a spouse`,
        desc:       `${name} has ${personChildren.get(person.id).length} child(ren) recorded but no spouse is linked. Add their spouse to complete the family structure.`,
        confidence: 88,
        action:     'Add Spouse',
      });
    }

    // 2. No parents recorded
    if (!hasParent.has(person.id)) {
      suggestions.push({
        id:         `parent-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_PARENT,
        personId:   person.id,
        personName: name,
        title:      `${name} has no parents in the tree`,
        desc:       `Consider adding ${name}'s parents to extend the family tree upward and connect more generations.`,
        confidence: 75,
        action:     'Add Parents',
      });
    }

    // 3. Missing biography
    if (!person.bio || person.bio.trim().length < 10) {
      suggestions.push({
        id:         `bio-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_BIO,
        personId:   person.id,
        personName: name,
        title:      `Add a biography for ${name}`,
        desc:       `A biography preserves ${name}'s life story for future generations. Even a few sentences make a big difference.`,
        confidence: 95,
        action:     'Add Biography',
      });
    }

    // 4. Missing profile photo
    if (!person.photoUrl && !person.photo) {
      suggestions.push({
        id:         `photo-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_PHOTO,
        personId:   person.id,
        personName: name,
        title:      `Add a photo of ${name}`,
        desc:       `A photograph makes the family tree more personal and helps future generations recognise their ancestors.`,
        confidence: 90,
        action:     'Add Photo',
      });
    }

    // 5. Missing birth date
    if (!person.dob && !person.birthDate && !person.birthYear) {
      suggestions.push({
        id:         `dob-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_BIRTH_DATE,
        personId:   person.id,
        personName: name,
        title:      `Birth date unknown for ${name}`,
        desc:       `Adding ${name}'s birth date helps build an accurate timeline and enables age calculations in the tree.`,
        confidence: 80,
        action:     'Add Birth Date',
      });
    }

    // 6. No oral stories recorded
    if (!storyPersonIds.has(person.id)) {
      suggestions.push({
        id:         `story-${person.id}`,
        type:       SUGGESTION_TYPES.MISSING_STORY,
        personId:   person.id,
        personName: name,
        title:      `No stories recorded for ${name}`,
        desc:       `Record an oral history or written story about ${name} to preserve their memory and cultural heritage.`,
        confidence: 85,
        action:     'Record Story',
      });
    }

    // 7. Isolated person (no relationships at all)
    if (!hasSpouse.has(person.id) && !hasParent.has(person.id) && !personChildren.has(person.id)) {
      suggestions.push({
        id:         `isolated-${person.id}`,
        type:       SUGGESTION_TYPES.ISOLATED_PERSON,
        personId:   person.id,
        personName: name,
        title:      `${name} is not connected to anyone`,
        desc:       `${name} has no parent, spouse, or child relationships. Connect them to the family tree to show their place in the lineage.`,
        confidence: 92,
        action:     'Connect to Tree',
      });
    }
  });

  // Sort by confidence desc, then priority asc
  return suggestions
    .sort((a,b) => b.confidence - a.confidence || a.type.priority - b.type.priority)
    .slice(0, 20); // max 20 suggestions
}

// ─── Completeness score ────────────────────────────────────────────────────────
function getCompleteness(persons, marriages, stories) {
  if (persons.length === 0) return 0;
  let total = 0, filled = 0;
  const storyPersonIds = new Set(stories.map(s => s.personId).filter(Boolean));

  persons.forEach(p => {
    total += 5; // 5 fields per person
    if (p.name && p.name.trim())                           filled++;
    if (p.bio && p.bio.trim().length >= 10)                filled++;
    if (p.photoUrl || p.photo)                             filled++;
    if (p.dob || p.birthDate || p.birthYear)               filled++;
    if (storyPersonIds.has(p.id))                          filled++;
  });

  return Math.round((filled / total) * 100);
}

// ─── Suggestion Card ───────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, onDismiss, onAction, t, index }) {
  const { type, title, desc, confidence, action } = suggestion;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ai-card"
      style={{
        background: t.card,
        border: `1.5px solid ${t.border}`,
        borderLeft: `4px solid ${type.color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
        animation: `fadeIn .3s ease ${index * .06}s both`,
        marginBottom: 10,
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        {/* Icon */}
        <div style={{
          width:38, height:38, borderRadius:10, flexShrink:0,
          background: `${type.color}18`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18,
        }}>
          {type.icon}
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:t.text, lineHeight:1.4 }}>{title}</div>
            <button onClick={() => onDismiss(suggestion.id)}
              style={{ background:'none', border:'none', cursor:'pointer', color:t.textFaint, padding:2, display:'flex', flexShrink:0 }}>
              <X size={14}/>
            </button>
          </div>

          {/* Confidence bar */}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'6px 0' }}>
            <div className="ai-progress-bar" style={{ flex:1 }}>
              <div className="ai-progress-fill" style={{ width:`${confidence}%`, background:type.color }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:type.color, whiteSpace:'nowrap' }}>
              {confidence}% confidence
            </span>
          </div>

          {/* Description — expandable */}
          <div style={{ fontSize:12, color:t.textMuted, lineHeight:1.6, marginBottom:8 }}>
            {expanded ? desc : desc.slice(0, 80) + (desc.length > 80 ? '…' : '')}
            {desc.length > 80 && (
              <button onClick={() => setExpanded(e => !e)}
                style={{ background:'none', border:'none', cursor:'pointer', color:type.color, fontSize:11, fontWeight:600, padding:'0 4px', fontFamily:'inherit' }}>
                {expanded ? 'less' : 'more'}
              </button>
            )}
          </div>

          {/* Action button */}
          <button className="ai-btn" onClick={() => onAction(suggestion)}
            style={{ background:`${type.color}18`, color:type.color, border:`1px solid ${type.color}30` }}>
            {action} <ChevronRight size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completeness Ring ─────────────────────────────────────────────────────────
function CompletenessRing({ score, t }) {
  const r = 28, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#ef4444';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', background:t.card, border:`1px solid ${t.border}`, borderRadius:14, marginBottom:16 }}>
      <svg width={72} height={72} style={{ flexShrink:0 }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke={t.dark ? '#374151' : '#f3f4f6'} strokeWidth={6}/>
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition:'stroke-dashoffset 1s ease' }}/>
        <text x={36} y={36} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={800} fill={color}>{score}%</text>
      </svg>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:4 }}>Tree Completeness</div>
        <div style={{ fontSize:12, color:t.textMuted, lineHeight:1.6 }}>
          {score >= 80 ? '🌟 Excellent! Your tree is very well documented.' :
           score >= 60 ? '👍 Good progress! Keep adding details.' :
           score >= 40 ? '📝 Getting started — add photos and biographies.' :
                         '🌱 Just beginning — lots of information to add!'}
        </div>
        <div style={{ marginTop:6, display:'flex', gap:8 }}>
          {['Photos','Biographies','Dates','Stories'].map((label,i) => (
            <span key={i} style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:t.bg, border:`1px solid ${t.border}`, color:t.textMuted, fontWeight:500 }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AITreeCompletion({ treeId, onPersonClick }) {
  const { currentUser } = useAuth();
  const t               = useTheme();
  const [persons,   setPersons]   = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [stories,   setStories]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ai-dismissed-${treeId}`) || '[]'); }
    catch { return []; }
  });
  const [filter,   setFilter]    = useState('all');
  const [expanded, setExpanded]  = useState(true);

  // Load persons from subcollection
  useEffect(() => {
    if (!treeId) return;
    setLoading(true);

    const unsubP = onSnapshot(
      collection(db, 'trees', treeId, 'persons'),
      snap => { setPersons(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false); },
      err => { console.error('persons error:', err); setLoading(false); }
    );

    // Also try top-level persons collection filtered by treeId
    const unsubM = onSnapshot(
      query(collection(db, 'marriages'), where('treeId', '==', treeId)),
      snap => setMarriages(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
      () => {}
    );

    const unsubS = onSnapshot(
      query(collection(db, 'stories'), where('treeId', '==', treeId)),
      snap => setStories(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
      () => {}
    );

    return () => { unsubP(); unsubM(); unsubS(); };
  }, [treeId]);

  const allSuggestions = useMemo(
    () => generateSuggestions(persons, marriages, stories),
    [persons, marriages, stories]
  );

  const completeness = useMemo(
    () => getCompleteness(persons, marriages, stories),
    [persons, marriages, stories]
  );

  // Filter out dismissed
  const visibleSuggestions = useMemo(() => {
    const base = allSuggestions.filter(s => !dismissed.includes(s.id));
    if (filter === 'all') return base;
    return base.filter(s => s.type.id === filter);
  }, [allSuggestions, dismissed, filter]);

  const handleDismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem(`ai-dismissed-${treeId}`, JSON.stringify(next)); } catch {}
  };

  const handleAction = (suggestion) => {
    // Navigate to person if onPersonClick provided
    if (onPersonClick && suggestion.personId) {
      onPersonClick(suggestion.personId, suggestion.type.id);
    }
  };

  const resetDismissed = () => {
    setDismissed([]);
    try { localStorage.removeItem(`ai-dismissed-${treeId}`); } catch {}
  };

  // Group types for filter tabs
  const typeGroups = [
    { id:'all',                    label:'All',         count:allSuggestions.filter(s=>!dismissed.includes(s.id)).length },
    { id:'missing_spouse',         label:'Spouse',      count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='missing_spouse').length },
    { id:'missing_parent',         label:'Parents',     count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='missing_parent').length },
    { id:'missing_bio',            label:'Biography',   count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='missing_bio').length },
    { id:'missing_photo',          label:'Photos',      count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='missing_photo').length },
    { id:'missing_story',          label:'Stories',     count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='missing_story').length },
    { id:'isolated_person',        label:'Isolated',    count:allSuggestions.filter(s=>!dismissed.includes(s.id)&&s.type.id==='isolated_person').length },
  ].filter(g => g.id === 'all' || g.count > 0);

  return (
    <>
      <style>{css}</style>
      <div style={{ width:'100%' }}>

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom: expanded ? 14 : 0,
          cursor:'pointer',
          padding:'4px 0',
        }} onClick={() => setExpanded(e => !e)}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#14532d,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={17} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:t.text, display:'flex', alignItems:'center', gap:8 }}>
                AI Suggestions
                {visibleSuggestions.length > 0 && (
                  <span style={{ fontSize:11, background:'#16a34a', color:'#fff', borderRadius:10, padding:'2px 7px', fontWeight:700 }}>
                    {visibleSuggestions.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize:11, color:t.textMuted }}>
                {loading ? 'Analysing tree…' : `${persons.length} members · ${completeness}% complete`}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {dismissed.length > 0 && (
              <button className="ai-btn" onClick={e => { e.stopPropagation(); resetDismissed(); }}
                style={{ background:t.bg, color:t.textMuted, border:`1px solid ${t.border}`, padding:'4px 10px' }}>
                <RefreshCw size={11}/> Reset
              </button>
            )}
            {expanded ? <ChevronUp size={16} color={t.textMuted}/> : <ChevronDown size={16} color={t.textMuted}/>}
          </div>
        </div>

        {expanded && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            {/* Loading */}
            {loading && (
              <div>
                {[0,1,2].map(i => (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div className="ai-skeleton" style={{ height:80, borderRadius:14 }}/>
                  </div>
                ))}
              </div>
            )}

            {/* No persons yet */}
            {!loading && persons.length === 0 && (
              <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:'24px', textAlign:'center' }}>
                <TreePine size={32} color={t.textFaint} style={{ marginBottom:10 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:4 }}>Tree is empty</div>
                <div style={{ fontSize:12, color:t.textMuted }}>Add family members to get AI suggestions.</div>
              </div>
            )}

            {/* Has persons */}
            {!loading && persons.length > 0 && (
              <>
                {/* Completeness ring */}
                <CompletenessRing score={completeness} t={t}/>

                {/* Filter tabs */}
                {typeGroups.length > 1 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                    {typeGroups.map(g => (
                      <button key={g.id} className="ai-btn" onClick={() => setFilter(g.id)}
                        style={{
                          background: filter === g.id ? '#16a34a' : t.bg,
                          color:      filter === g.id ? '#fff' : t.textMuted,
                          border:     `1px solid ${filter === g.id ? '#16a34a' : t.border}`,
                          padding:'4px 10px', fontSize:11,
                        }}>
                        {g.label} {g.count > 0 && <span style={{ opacity:.8 }}>({g.count})</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {visibleSuggestions.length === 0 ? (
                  <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:'24px', textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>🎉</div>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:4 }}>
                      {filter === 'all' ? 'All suggestions reviewed!' : `No ${filter.replace(/_/g,' ')} suggestions`}
                    </div>
                    <div style={{ fontSize:12, color:t.textMuted }}>
                      {dismissed.length > 0 ? 'Click Reset to see dismissed suggestions.' : 'Your tree looks great!'}
                    </div>
                  </div>
                ) : (
                  <div>
                    {visibleSuggestions.map((suggestion, i) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onDismiss={handleDismiss}
                        onAction={handleAction}
                        t={t}
                        index={i}
                      />
                    ))}
                    {visibleSuggestions.length >= 10 && (
                      <div style={{ textAlign:'center', fontSize:12, color:t.textMuted, padding:'8px 0' }}>
                        Showing top {visibleSuggestions.length} suggestions
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}