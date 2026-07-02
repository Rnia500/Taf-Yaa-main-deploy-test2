import React, { useState, useMemo } from 'react';
import { Brain, Sparkles, UserPlus, X, Check, ChevronRight, Lightbulb } from 'lucide-react';

const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .ai-card { transition:box-shadow .2s,transform .2s; }
  .ai-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1) !important; transform:translateY(-1px); }
`;

// ─── AI Engine ────────────────────────────────────────────────────────────────
function generateSuggestions(persons, marriages) {
  const suggestions = [];

  // Rule 1: Person has children but no spouse recorded
  persons.forEach(person => {
    const isParent = marriages.some(m =>
      (m.husbandId === person.id || (m.wives||[]).some(w=>w.wifeId===person.id)) &&
      ((m.childrenIds||[]).length > 0 || (m.wives||[]).some(w=>(w.childrenIds||[]).length>0))
    );
    const hasSpouse = marriages.some(m =>
      m.husbandId === person.id || (m.wives||[]).some(w=>w.wifeId===person.id)
    );
    if (isParent && !hasSpouse) {
      suggestions.push({
        id: `spouse-${person.id}`,
        type: 'missing_spouse',
        confidence: 85,
        title: `${person.name} may have a spouse`,
        description: `${person.name} has children recorded but no spouse. Consider adding their partner.`,
        icon: '💍',
        action: `Add spouse for ${person.name}`,
        personId: person.id,
      });
    }
  });

  // Rule 2: Children without grandparents
  persons.forEach(person => {
    const isChild = marriages.some(m => (m.childrenIds||[]).includes(person.id) ||
      (m.wives||[]).some(w=>(w.childrenIds||[]).includes(person.id)));
    const parentMarriage = marriages.find(m =>
      (m.childrenIds||[]).includes(person.id) ||
      (m.wives||[]).some(w=>(w.childrenIds||[]).includes(person.id))
    );
    if (isChild && parentMarriage) {
      const fatherId = parentMarriage.husbandId;
      const father = persons.find(p=>p.id===fatherId);
      if (father) {
        const fatherHasParents = marriages.some(m =>
          (m.childrenIds||[]).includes(fatherId) ||
          (m.wives||[]).some(w=>(w.childrenIds||[]).includes(fatherId))
        );
        if (!fatherHasParents && persons.length > 3) {
          suggestions.push({
            id: `grandparents-${fatherId}`,
            type: 'missing_grandparents',
            confidence: 70,
            title: `${father.name}'s parents are missing`,
            description: `Add ${father.name}'s parents to complete the paternal grandparent line.`,
            icon: '👴👵',
            action: `Add parents for ${father.name}`,
            personId: fatherId,
          });
        }
      }
    }
  });

  // Rule 3: Single person with no connections
  persons.forEach(person => {
    const hasConnection = marriages.some(m =>
      m.husbandId === person.id ||
      (m.wives||[]).some(w=>w.wifeId===person.id) ||
      (m.childrenIds||[]).includes(person.id) ||
      (m.wives||[]).some(w=>(w.childrenIds||[]).includes(person.id))
    );
    if (!hasConnection && persons.length > 1) {
      suggestions.push({
        id: `isolated-${person.id}`,
        type: 'isolated_person',
        confidence: 60,
        title: `${person.name} is not connected`,
        description: `${person.name} has no family connections yet. Link them to the tree structure.`,
        icon: '🔗',
        action: `Connect ${person.name} to the tree`,
        personId: person.id,
      });
    }
  });

  // Rule 4: Missing birth dates
  const missingDates = persons.filter(p => !p.dob && !p.isDeceased).slice(0, 2);
  missingDates.forEach(person => {
    suggestions.push({
      id: `dob-${person.id}`,
      type: 'missing_data',
      confidence: 95,
      title: `${person.name}'s birth date is missing`,
      description: `Adding birth dates helps establish generational timelines and improves tree accuracy.`,
      icon: '📅',
      action: `Add birth date for ${person.name}`,
      personId: person.id,
    });
  });

  // Rule 5: Tree completeness insight
  if (persons.length > 0) {
    const completeness = Math.round(
      (persons.filter(p => p.dob && p.photoUrl && p.tribe).length / persons.length) * 100
    );
    if (completeness < 80) {
      suggestions.push({
        id: 'completeness',
        type: 'completeness',
        confidence: 100,
        title: `Tree is ${completeness}% complete`,
        description: `${persons.length - Math.round(persons.length * completeness/100)} profiles are missing photos, birth dates, or cultural info.`,
        icon: '📊',
        action: 'View incomplete profiles',
        personId: null,
        isInsight: true,
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return suggestions.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  }).slice(0, 6);
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#6b7280';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:4, background:'#f3f4f6', borderRadius:20, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:20, transition:'width 1s ease' }}/>
      </div>
      <span style={{ fontSize:10, fontWeight:600, color, whiteSpace:'nowrap' }}>{value}%</span>
    </div>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, index, onDismiss, onAction }) {
  const typeColors = {
    missing_spouse:      '#db2777',
    missing_grandparents:'#7c3aed',
    isolated_person:     '#ea580c',
    missing_data:        '#2563eb',
    completeness:        '#16a34a',
  };
  const color = typeColors[suggestion.type] || '#16a34a';

  return (
    <div className="ai-card" style={{
      background:'#fff', border:'1px solid #f0f0f0',
      borderRadius:14, padding:'14px 16px',
      boxShadow:'0 2px 6px rgba(0,0,0,.04)',
      animation:`fadeIn .35s ease ${index*.06}s both`,
      borderLeft:`3px solid ${color}`,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        {/* Icon */}
        <div style={{ width:40, height:40, borderRadius:11, background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
          {suggestion.icon}
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{suggestion.title}</div>
            <button onClick={()=>onDismiss(suggestion.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2, display:'flex' }}>
              <X size={14}/>
            </button>
          </div>
          <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, marginBottom:8 }}>{suggestion.description}</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af', marginBottom:3 }}>AI Confidence</div>
            <ConfidenceBar value={suggestion.confidence}/>
          </div>
          {!suggestion.isInsight && (
            <button onClick={()=>onAction(suggestion)}
              style={{ display:'flex', alignItems:'center', gap:5, background:`${color}12`, color, border:`1px solid ${color}30`, borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <UserPlus size={13}/>{suggestion.action}<ChevronRight size={12}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AITreeCompletion = ({ persons = [], marriages = [], onAddPerson, compact = false }) => {
  const [dismissed, setDismissed] = useState(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [isOpen, setIsOpen]       = useState(true);

  const suggestions = useMemo(()=>
    generateSuggestions(persons, marriages).filter(s => !dismissed.has(s.id)),
    [persons, marriages, dismissed]
  );

  const handleDismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  const handleAnalyze = () => {
    setAnalyzing(true);
    setDismissed(new Set()); // reset dismissed
    setTimeout(() => setAnalyzing(false), 1200);
  };

  const handleAction = (suggestion) => {
    if (onAddPerson) onAddPerson(suggestion);
  };

  if (!isOpen) {
    return (
      <button onClick={()=>setIsOpen(true)} style={{
        display:'flex', alignItems:'center', gap:8,
        background:'linear-gradient(135deg,#14532d,#16a34a)',
        color:'#fff', border:'none', borderRadius:12,
        padding:'10px 16px', cursor:'pointer', fontSize:13,
        fontWeight:600, fontFamily:'inherit',
        boxShadow:'0 2px 8px rgba(22,163,74,.3)',
      }}>
        <Brain size={16}/>
        AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
      </button>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{
        background:'#f8fafc', border:'1px solid #e5e7eb',
        borderRadius:18, overflow:'hidden',
        animation:'fadeIn .3s ease',
        boxShadow:'0 4px 16px rgba(0,0,0,.06)',
      }}>
        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,#14532d,#166534)',
          padding:'16px 18px', display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {analyzing
              ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
              : <Brain size={20} color="#fff"/>
            }
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>AI Tree Assistant</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>
              {analyzing ? 'Analysing your tree…' : `${suggestions.length} suggestion${suggestions.length!==1?'s':''} found`}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 10px', color:'#fff', display:'flex', alignItems:'center', gap:5, fontSize:12, fontFamily:'inherit' }}>
              <Sparkles size={13}/>{analyzing ? 'Analysing…' : 'Re-analyse'}
            </button>
            <button onClick={()=>setIsOpen(false)}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 8px', color:'#fff', display:'flex' }}>
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'16px', maxHeight:compact?280:420, overflowY:'auto' }}>
          {suggestions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 16px' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 }}>Tree looks complete!</div>
              <div style={{ fontSize:12, color:'#9ca3af' }}>No suggestions at this time. Keep adding family members!</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {suggestions.map((s, i) => (
                <SuggestionCard key={s.id} suggestion={s} index={i} onDismiss={handleDismiss} onAction={handleAction}/>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <div style={{ padding:'10px 16px', borderTop:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:8, background:'#fff' }}>
            <Lightbulb size={13} color="#9ca3af"/>
            <span style={{ fontSize:11, color:'#9ca3af' }}>Suggestions are generated from your tree structure. Always verify with family members.</span>
          </div>
        )}
      </div>
    </>
  );
};

export default AITreeCompletion;